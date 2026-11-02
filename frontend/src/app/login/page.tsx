import { AuthScreen } from '@/components/auth/AuthScreen';
import { SignedOutOnly } from '@/components/auth/SignedOutOnly';
import '@/app/auth.css';

export default function LoginPage() {
  return <SignedOutOnly><AuthScreen mode="login" /></SignedOutOnly>;
}
