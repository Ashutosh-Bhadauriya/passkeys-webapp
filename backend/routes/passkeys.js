import express from "express";
const router = express.Router();
import { handlePasskeyRegister, handlePasskeyLogin, listPasskeyCredentials, deletePasskeyCredential, updatePasskeyCredential } from "../controllers/passkey.js";
import { checkAuth } from "../middleware/auth.js";


router.post("/passkeys/register", checkAuth, handlePasskeyRegister);
router.post("/passkeys/login", handlePasskeyLogin);
router.get("/passkeys/credentials", checkAuth, listPasskeyCredentials);
router.delete("/passkeys/credentials/:credentialID", checkAuth, deletePasskeyCredential);
// router.patch("/passkeys/credentials/:credentialID", updatePasskeyCredential);

export default router;
