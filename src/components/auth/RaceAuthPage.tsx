import { AuthScreen } from "../game/AuthScreen";
import { UserProfile } from "../../types";

export interface RaceAuthPageProps {
  initialTab?: "login" | "register";
  onLoginSuccess?: (user: UserProfile) => void;
}

export function RaceAuthPage({
  initialTab = "login",
  onLoginSuccess = () => {},
}: RaceAuthPageProps) {
  return (
    <AuthScreen
      initialTab={initialTab}
      onLoginSuccess={onLoginSuccess}
    />
  );
}

export default RaceAuthPage;
