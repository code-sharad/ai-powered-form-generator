import { Form } from "@/models/Froms.model";

const generateSlug = async (formName: string) => {
  let slug = formName.toLowerCase().replace(/\s+/g, '-').substring(0, 50);
  let unique = slug;
  let counter = 1;

  while (await Form.findOne({ slug: unique })) {
    unique = `${slug}-${counter}`;
    counter++;
  }
  return unique;
};

export default generateSlug;