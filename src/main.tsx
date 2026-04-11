import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// --- Security: Validate encryption key at startup ---
const INSECURE_DEFAULTS = [
  'apice-capital-default-key-change-in-production',
  'CHANGE_ME_run_openssl_rand_base64_32',
  '',
];

const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || '';

if (import.meta.env.DEV) {
  if (INSECURE_DEFAULTS.includes(encryptionKey)) {
    console.error(
      '[SECURITY] VITE_ENCRYPTION_KEY is missing or using an insecure default value. ' +
      'Generate a proper key: openssl rand -base64 32 ' +
      'and set it in your .env file. Encryption features will be disabled.'
    );
  } else if (encryptionKey.length < 32) {
    console.warn(
      '[SECURITY] VITE_ENCRYPTION_KEY is shorter than 32 characters. ' +
      'This weakens encryption. Generate a stronger key: openssl rand -base64 32'
    );
  }
}

createRoot(document.getElementById("root")!).render(<App />);
