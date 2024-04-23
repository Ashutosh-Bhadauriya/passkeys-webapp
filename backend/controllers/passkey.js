import {
  startServerPasskeyRegistration,
  finishServerPasskeyRegistration,
  startServerPasskeyLogin,
  finishServerPasskeyLogin,
  listCredentials,
  deleteCredential,
} from "../service/passkey.js";
import { getUserID } from "../service/get-user-id.js";
import { v4 as uuidv4 } from "uuid";
import { setUser } from "../service/auth.js";
import db from "../db.js";

async function handlePasskeyRegister(req, res) {
  const { user } = req;
  const userID = user.id;

  if (!userID) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  console.log("userId", userID);

  const { start, finish, credential } = req.body;

  try {
    if (start) {
      const createOptions = await startServerPasskeyRegistration(userID);
      console.log("registration start");
      return res.json({ createOptions });
    }
    if (finish) {
      await finishServerPasskeyRegistration(credential);
      return res.json({ message: "Registered Passkey" });
    }
  } catch (error) {
    return res.status(500).json(error);
  }
}

async function handlePasskeyLogin(req, res) {
  const { start, finish, options } = req.body;

  try {
    if (start) {
      const loginOptions = await startServerPasskeyLogin();
      return res.json({ loginOptions });
    }
    if (finish) {
      const jwtToken = await finishServerPasskeyLogin(options);
      const userID = await getUserID(jwtToken?.token ?? "");
      console.log("userID from hanko", userID);
      const user = db.users.find((user) => user.id === userID);
      if (!user) {
        return res.status(401).json({ message: "Invalid user" });
      }
      console.log("user", user);
      const sessionId = uuidv4();
      setUser(sessionId, user);
      res.cookie("sessionId", sessionId);
      return res.json({ message: " Passkey Login successful" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred during the passke login process." });
  }
}

async function listPasskeyCredentials(req, res) {
  const { user } = req;
  const userID = user.id;

  if (!userID) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const credentials = await listCredentials(userID);
    return res.json({ credentials });
  } catch (error) {
    return res.status(500).json(error);
  }
}

async function deletePasskeyCredential(req, res) {
  const { user } = req;
  const userID = user.id;

  if (!userID) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { credentialID } = req.params;

  try {
    await deleteCredential(credentialID);
    return res.json({ message: "Credential deleted" });
  } catch (error) {
    return res.status(500).json(error);
  }
}

async function updatePasskeyCredential(req, res) {
  const { credentialID } = req.params;
  const { name } = req.body; 
  const tenantId = process.env.PASSKEYS_TENANT_ID;
  const apiKey = process.env.PASSKEYS_API_KEY;
  const baseUrl = `https://passkeys.hanko.io/${tenantId}/credentials/${credentialID}`;

  if (!tenantId || !apiKey) {
    return res.status(500).json({ message: "Server configuration error" });
  }

  const options = {
    method: "PATCH",
    headers: { apiKey: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  };

  try {
    const response = await fetch(baseUrl, options);
    if (!response.ok) {
      throw new Error(`Failed to update credential: ${response.statusText}`);
    }
    // const responseData = await response.json();
    if (
      response.headers.get("Content-Type")?.includes("application/json") &&
      response.ok
    ) {
      const responseData = await response.json();
      res.json({
        message: "Credential updated successfully",
        data: responseData,
      });
    } else {
      console.error("Non-JSON response or error", response.statusText);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

export {
  handlePasskeyRegister,
  handlePasskeyLogin,
  listPasskeyCredentials,
  deletePasskeyCredential,
  updatePasskeyCredential,
};
