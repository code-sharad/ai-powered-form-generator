/**
 * Fill the analytics dashboard with realistic dummy responses.
 *
 *   bun scripts/seed-analytics.ts                 # create/seed demo@formora.test
 *   bun scripts/seed-analytics.ts --email you@x   # seed an existing account
 *   bun scripts/seed-analytics.ts --clean         # remove seeded responses
 *
 * Seeded responses are tagged in metadata.userAgent so --clean can remove
 * exactly them. Nothing else in the database is touched, except the form's
 * submissionStats, which are recomputed from the remaining data.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { config } from '@/config';
import { User } from '@/models/User.model';
import { Form } from '@/models/Froms.model';
import { Submission } from '@/models/Submissin.model';

const SEED_TAG = 'formora-analytics-seed';
const DAY_MS = 86_400_000;

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const email = argument('email') ?? 'demo@formora.test';
const months = Number(argument('months') ?? 30);
const cleanOnly = flag('clean');

/** Deterministic noise, so every run produces the same report shape. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const names = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Linus Torvalds', 'Margaret Hamilton', 'Tim Berners-Lee', 'Barbara Liskov'];
const comments = ['Excited for the hands-on sessions.', 'Please share the slides afterwards.', 'Interested in the advanced track.', 'Coming with a teammate.', 'First workshop, looking forward to it.'];

const fields = [
  { fieldId: 'full_name', type: 'NAME', displayName: 'Full name', mand: true, placeholder: 'Your name' },
  { fieldId: 'email', type: 'EMAIL', displayName: 'Email address', mand: true, placeholder: 'you@example.com' },
  { fieldId: 'experience', type: 'RADIO', displayName: 'Experience level', mand: true, choices: ['Beginner', 'Intermediate', 'Advanced'] },
  { fieldId: 'topics', type: 'CHECKBOX', displayName: 'Topics', mand: false, choices: ['Design systems', 'Prototyping', 'Research'] },
  { fieldId: 'rating', type: 'RATING', displayName: 'How likely are you to recommend it?', mand: false },
  { fieldId: 'notes', type: 'MULTI_LINE', displayName: 'Anything else?', mand: false, placeholder: 'Optional notes' },
];

const utcDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

async function recomputeStats(formId: mongoose.Types.ObjectId) {
  const [stats] = await Submission.aggregate<{ count: number; last: Date | null }>([
    { $match: { formId } },
    { $group: { _id: null, count: { $sum: 1 }, last: { $max: '$submittedAt' } } },
  ]);
  await Form.updateOne({ _id: formId }, {
    'submissionStats.count': stats?.count ?? 0,
    'submissionStats.lastSubmittedAt': stats?.last ?? undefined,
  });
}

if (!config.DB_URL) throw new Error('DATABASE_URL is not set.');
await mongoose.connect(config.DB_URL);

const shouldBackdate = flag('backdate') || !(await User.exists({ email }));
let user = await User.findOne({ email });
if (!user) {
  if (cleanOnly) {
    console.log(`No account for ${email}; nothing to clean.`);
    await mongoose.disconnect();
    process.exit(0);
  }
  user = await User.create({
    name: 'Demo Workspace',
    email,
    password: await bcrypt.hash('Demo12345', 10),
    createdAt: new Date(Date.UTC(utcDay(new Date()).getUTCFullYear(), utcDay(new Date()).getUTCMonth() - months, 1)),
  });
  console.log(`Created ${email} (password Demo12345)`);
}

const ownedForms = await Form.find({ userId: user._id });
let form = ownedForms[0];
if (!form) {
  if (cleanOnly) {
    console.log('No forms on this account; nothing to clean.');
    await mongoose.disconnect();
    process.exit(0);
  }
  const baseSlug = 'demo-analytics-workshop';
  const slugTaken = await Form.exists({ slug: baseSlug });
  form = await Form.create({
    userId: user._id,
    formName: 'Design workshop registration',
    slug: slugTaken ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug,
    description: 'A demo form with realistic response history for the analytics views.',
    category: 'registration',
    fields,
    presentation: 'classic',
    sharing: { isPublic: false },
    createdAt: user.createdAt,
    updatedAt: new Date(),
  });
  console.log(`Created form ${form.formName}`);
}
if (!form) throw new Error('No form to seed.');

const formIds = (await Form.find({ userId: user._id }).select('_id')).map(item => item._id);

// Start from a clean slate so reruns do not stack duplicate history.
const removed = await Submission.deleteMany({ formId: { $in: formIds }, 'metadata.userAgent': SEED_TAG });
if (removed.deletedCount) console.log(`Removed ${removed.deletedCount} previously seeded responses.`);

if (cleanOnly) {
  for (const id of formIds) await recomputeStats(id);
  console.log('Seeded responses removed and stats recomputed.');
  await mongoose.disconnect();
  process.exit(0);
}

const today = utcDay(new Date());
const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - months, 1));
// Align the account and form start with the data so Max and 2Y cover the history.
if (shouldBackdate) {
  await User.updateOne({ _id: user._id }, { $min: { createdAt: start } });
  await Form.updateOne({ _id: form._id }, { $min: { createdAt: start } });
}

const random = mulberry32(20261103);
const documents: Array<Record<string, unknown>> = [];
let dayIndex = 0;

for (let cursor = new Date(start); cursor <= today; cursor = new Date(cursor.getTime() + DAY_MS), dayIndex++) {
  const weekday = cursor.getUTCDay();
  const weekend = weekday === 0 || weekday === 6 ? 0.45 : 1;
  const season = 1 + 0.28 * Math.sin((dayIndex / 58) * Math.PI * 2);
  const growth = 0.55 + 0.75 * (dayIndex / Math.max(1, (months * 30)));
  const noise = 0.35 + random() * 1.2;
  const count = Math.max(0, Math.round(3.1 * weekend * season * growth * noise));

  for (let index = 0; index < count; index++) {
    const name = names[Math.floor(random() * names.length)];
    const address = `${name.toLowerCase().replace(/[^a-z]+/g, '.')}${Math.floor(random() * 900 + 100)}@example.com`;
    const submittedAt = new Date(cursor.getTime() + Math.floor(random() * 14 + 8) * 3_600_000 + Math.floor(random() * 60) * 60_000);
    documents.push({
      formId: form._id,
      userId: user._id,
      submitterEmail: address,
      responses: {
        full_name: name,
        email: address,
        experience: fields[2].choices[Math.floor(random() * 3)],
        topics: fields[3].choices.filter(() => random() > 0.55),
        rating: 3 + Math.floor(random() * 3),
        notes: random() > 0.5 ? comments[Math.floor(random() * comments.length)] : '',
      },
      submittedAt,
      metadata: { ipAddress: '127.0.0.1', userAgent: SEED_TAG },
    });
  }
}

for (let offset = 0; offset < documents.length; offset += 1000) {
  await Submission.insertMany(documents.slice(offset, offset + 1000));
}

for (const id of formIds) await recomputeStats(id);

console.log(`${email} is ready: ${documents.length} responses from ${isoDay(start)} to ${isoDay(today)}.`);
if (email === 'demo@formora.test') console.log('Log in with demo@formora.test / Demo12345');
await mongoose.disconnect();
