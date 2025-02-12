import axios from "axios";
import colors from "colors";
import Web3 from "web3";
import fs from "fs/promises";
import { HttpsProxyAgent } from "https-proxy-agent";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const allowedState = 'na';

const login = async (privateKey, proxy) => {
  const web3 = new Web3(new Web3.providers.HttpProvider("https://sepolia.infura.io"));
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);

  const httpsAgent = proxy ? new HttpsProxyAgent(proxy) : null;

  const getNonce = await axios.get("https://dapp-backend-4x.fractionai.xyz/api3/auth/nonce", {
    httpsAgent,
  });
  const nonce = getNonce.data.nonce;

  const issuedAt = new Date().toISOString();
  const message = `dapp.fractionai.xyz wants you to sign in with your Ethereum account:
${account.address}

Sign in with your wallet to Fraction AI.

URI: https://dapp.fractionai.xyz
Version: 1
Chain ID: 11155111
Nonce: ${nonce}
Issued At: ${issuedAt}`;

  const signature = web3.eth.accounts.sign(message, privateKey);

  const payload = {
    message,
    signature: signature.signature,
    referralCode: "DA0D6A15",
  };

  const loginData = await axios.post("https://dapp-backend-4x.fractionai.xyz/api3/auth/verify", payload, {
    headers: {
      "Content-Type": "application/json",
    },
    httpsAgent,
  });

  return loginData.data;
};

const getAgents = async (accessToken, userId, proxy) => {
  const httpsAgent = proxy ? new HttpsProxyAgent(proxy) : null;

  const getAiagent = await axios.get(`https://dapp-backend-4x.fractionai.xyz/api3/agents/user/${userId}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Host': 'dapp-backend-4x.fractionai.xyz',
      'Allowed-State': allowedState, // Dùng giá trị allowedState từ đầu mã nguồn
      'Origin': 'https://dapp.fractionai.xyz',
    },
    httpsAgent,
  });

  const aiagent = getAiagent.data;
  const aiagentId = [];
  const nameAgent = [];
  for (let i = 0; i < aiagent.length; i++) {
    aiagentId.push(aiagent[i].id);
    nameAgent.push(aiagent[i].name);
  }

  return { aiagentId, nameAgent };
};

const joinRapBattle = async (accessToken, userId, agentId, proxy) => {
  const httpsAgent = proxy ? new HttpsProxyAgent(proxy) : null;

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'Host': 'dapp-backend-4x.fractionai.xyz',
    'Allowed-State': allowedState,
    'Origin': 'https://dapp.fractionai.xyz',
  };

  const data = {
    userId: userId,
    agentId: agentId, 
    entryFees: 0.001,
    sessionTypeId: 1, 
  };

  try {
    const response = await axios.post(
      `https://dapp-backend-4x.fractionai.xyz/api3/matchmaking/initiate`,
      data,
      { headers, httpsAgent } 
    );

    if (response.status === 200) {
      console.log(colors.green(`🎤 Successfully joined Rap Battle with Agent: ${agentId}`));
    }
  } catch (error) {
    console.log(colors.yellow(`⚠ Failed to join with Agent: ${agentId}, Reason: ${error.response?.data?.error || error.message}`));
  }
};

const processWallet = async (walletIndex, privateKey, proxy) => {
  try {
    const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : "0x" + privateKey;

    const proxyUrl = new URL(proxy);
    const ipAddress = proxyUrl.hostname;

    console.log(colors.cyan(`Wallet ${walletIndex + 1} [IP: ${ipAddress}]: Processing...`));

    const getLogin = await login(formattedPrivateKey, proxy);
    const getAiagent = await getAgents(getLogin.accessToken, getLogin.user.id, proxy);

    console.log(colors.green(`Wallet ${walletIndex + 1} [IP: ${ipAddress}]: Successfully logged in with address: ${getLogin.user.walletAddress}`));
    console.log(colors.green(`Wallet ${walletIndex + 1} [IP: ${ipAddress}]: Number of AI Agents: ${getAiagent.aiagentId.length}`));

    for (let j = 0; j < getAiagent.aiagentId.length; j++) {
      const aiagentId = getAiagent.aiagentId[j];
      const agentName = getAiagent.nameAgent[j];

      try {
        await joinRapBattle(getLogin.accessToken, getLogin.user.id, aiagentId, proxy);
        console.log(colors.green(`Wallet ${walletIndex + 1} [IP: ${ipAddress}]: Successfully joined Rap Battle with Agent: ${agentName} (ID: ${aiagentId})`));
      } catch (error) {
        console.log(
          colors.yellow(
            `Wallet ${walletIndex + 1} [IP: ${ipAddress}]: Failed to join with Agent: ${agentName} (ID: ${aiagentId}), Reason: ${error.response?.data?.error || error.message}`
          )
        );
      }
    }
  } catch (error) {
    console.error(colors.red(`Wallet ${walletIndex + 1} [IP: ${proxy}]: Error: ${error.message}`));
  }
};

const main = async () => {
  console.log(colors.blue("Starting Fractal Rap Battle program..."));

  const wallets = (await fs.readFile("wallet.txt", "utf-8"))
    .replace(/\r/g, "")
    .split("\n")
    .filter(Boolean);

  const proxies = (await fs.readFile("proxy.txt", "utf-8"))
    .replace(/\r/g, "")
    .split("\n")
    .filter(Boolean);

  if (wallets.length > proxies.length) {
    console.error(colors.red("Error: Not enough proxies for all wallet addresses!"));
    return;
  }

  while (true) {
    console.log(colors.blue("Starting to process wallets..."));

    await Promise.all(
      wallets.map((privateKey, index) => processWallet(index, privateKey, proxies[index]))
    );

    console.log(colors.blue("Processing complete, waiting 20 minutes for the next round..."));
    await delay(20 * 60 * 1000);
  }
};

main();
