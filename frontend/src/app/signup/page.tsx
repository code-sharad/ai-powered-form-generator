import { AuthScreen } from '@/components/auth/AuthScreen';
import { SignedOutOnly } from '@/components/auth/SignedOutOnly';
import '@/app/auth.css';

export default function SignupPage() {
  return <SignedOutOnly><AuthScreen mode="signup" /></SignedOutOnly>;
}
