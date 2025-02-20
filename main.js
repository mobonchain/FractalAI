import axios from "axios";
import colors from "colors";
import Web3 from "web3";
import fs from "fs/promises";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import readlineSync from "readline-sync";

const API_KEY = "YOUR_API_KEY";

let RunningAll = false;
let sessionTypeId = null;

async function solveCaptcha(apiKey, imageUrl) {
  try {
    console.log("🔄 Đang gửi ảnh lên 2Captcha...");
    const response = await fetch("http://2captcha.com/in.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        key: apiKey,
        method: "base64",
        body: await getBase64(imageUrl),
        json: 1,
      }),
    });

    const data = await response.json();
    if (data.status !== 1) throw new Error(`❌ Lỗi gửi CAPTCHA: ${data.request}`);

    console.log(`✅ CAPTCHA được gửi thành công! ID: ${data.request}`);
    return await getCaptchaResult(apiKey, data.request);
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
  }
}

async function getBase64(imageUrl) {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

async function getCaptchaResult(apiKey, requestId) {
  const checkUrl = `http://2captcha.com/res.php?key=${apiKey}&action=get&id=${requestId}&json=1`;

  console.log("⏳ Đang chờ kết quả...");

  for (let i = 0; i < 15; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const response = await fetch(checkUrl);
    const data = await response.json();

    if (data.status === 1) {
      console.log(`🎉 CAPTCHA giải thành công: ${data.request}`);
      return data.request;
    }

    console.log(`⌛ Chưa có kết quả, thử lại... (${i + 1}/15)`);
  }

  throw new Error("❌ Quá thời gian chờ CAPTCHA!");
}

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
    headers: { "Content-Type": "application/json" },
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
      'Allowed-State': 'na',
      'Origin': 'https://dapp.fractionai.xyz',
    },
    httpsAgent,
  });

  const aiagent = getAiagent.data;
  const rapBattleAgents = [];
  const dobbyArenaAgents = [];

  aiagent.forEach((agent) => {
    if (agent.sessionTypeId === 1) {
      rapBattleAgents.push(agent);
    } else if (agent.sessionTypeId === 5) {
      dobbyArenaAgents.push(agent);
    }
  });

  return { rapBattleAgents, dobbyArenaAgents };
};

const joinMatch = async (accessToken, userId, agentId, nonce, captchaText, sessionTypeId, proxy) => {
  const httpsAgent = proxy ? new HttpsProxyAgent(proxy) : null;

  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'Host': 'dapp-backend-4x.fractionai.xyz',
    'Allowed-State': 'na',
    'Origin': 'https://dapp.fractionai.xyz',
  };

  const data = {
    userId: userId,
    agentId: agentId,
    entryFees: 0.001,
    sessionTypeId: sessionTypeId,
    nonce: nonce,
    captchaText: captchaText,
  };

  try {
    const response = await axios.post(
      `https://dapp-backend-4x.fractionai.xyz/api3/matchmaking/initiate`,
      data,
      { headers, httpsAgent } 
    );

    if (response.status === 200) {
      console.log(colors.green(`🎤 Thành công tham gia trận đấu với agent: ${agentId}`));
      return true;
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message;

    if (errorMessage === "Invalid captcha") {
      console.log(colors.red("⚠ Lỗi: Invalid captcha, thử lại..."));
      return false;
    }

    if (errorMessage.includes("User has reached maximum number of sessions")) {
      console.log(colors.red("⚠ Lỗi: Đã đạt giới hạn phiên đấu, bỏ qua ví này."));
      return null;
    }

    console.log(colors.yellow(`⚠ Lỗi tham gia trận đấu với agent: ${agentId}, Lý do: ${errorMessage}`));
  }

  return true;
};

const processWallet = async (walletIndex, privateKey, proxy) => {
  try {
    const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : "0x" + privateKey;
    const proxyUrl = new URL(proxy);
    const ipAddress = proxyUrl.hostname;

    console.log(colors.cyan(`Ví ${walletIndex + 1} [IP: ${ipAddress}]: Đang xử lý...`));

    const getLogin = await login(formattedPrivateKey, proxy);
    const { rapBattleAgents, dobbyArenaAgents } = await getAgents(getLogin.accessToken, getLogin.user.id, proxy);

    console.log(colors.green(`Ví ${walletIndex + 1} [IP: ${ipAddress}]: Đăng nhập thành công với địa chỉ: ${getLogin.user.walletAddress}`));
    console.log(colors.green(`Ví ${walletIndex + 1} [IP: ${ipAddress}]: Số lượng AI Agents: Rap Battle: ${rapBattleAgents.length}, Dobby Arena: ${dobbyArenaAgents.length}`));

    let selectedAgents = RunningAll ? [...rapBattleAgents, ...dobbyArenaAgents] : sessionTypeId === 1 ? rapBattleAgents : dobbyArenaAgents;

    if (selectedAgents.length === 0) {
      console.log(colors.red("Không có agent nào để tham gia trận đấu."));
      return;
    }

  
    for (let agent of selectedAgents) {
      let success = false;
      while (!success) {
        const captchaData = await axios.get("https://dapp-backend-4x.fractionai.xyz/api3/auth/nonce", {
          headers: { 'Allowed-State': 'na' },
        });

        const captchaText = await solveCaptcha(API_KEY, captchaData.data.image);
        if (!captchaText) {
          console.log(colors.red("Không thể giải CAPTCHA."));
          return;
        }

        success = await joinMatch(getLogin.accessToken, getLogin.user.id, agent.id, captchaData.data.nonce, captchaText, agent.sessionTypeId, proxy);
        
        if (success === null) {
          console.log(colors.yellow(`Ví ${walletIndex + 1} [IP: ${ipAddress}]: Đạt giới hạn phiên đấu, dừng xử lý.`));
          return;
        }
      }
    }
  } catch (error) {
    console.error(colors.red(`Ví ${walletIndex + 1} [IP: ${proxy}]: Lỗi: ${error.message}`));
  }
};

const main = async () => {
  const runAllChoice = readlineSync.question('Bạn muốn tham gia tất cả các agent? (yes/no): ');
  RunningAll = runAllChoice.toLowerCase() === 'yes';

  if (!RunningAll) {
    const sessionTypeChoice = readlineSync.question('Bạn muốn tham gia trận đấu Rap Battle (1) hay Dobby Arena (5)? (Nhập 1 hoặc 5): ');
    sessionTypeId = (sessionTypeChoice === '5') ? 5 : 1;
  }

  console.log(colors.blue("Bắt đầu chương trình tham gia Rap Battle/Dobby Arena..."));

  const wallets = (await fs.readFile("wallet.txt", "utf-8"))
    .replace(/\r/g, "")
    .split("\n")
    .filter(Boolean);

  const proxies = (await fs.readFile("proxy.txt", "utf-8"))
    .replace(/\r/g, "")
    .split("\n")
    .filter(Boolean);

  if (wallets.length > proxies.length) {
    console.error(colors.red("Lỗi: Không đủ proxies cho tất cả các ví!"));
    return;
  }

  while (true) {
    console.log(colors.blue("Đang bắt đầu xử lý ví..."));

    for (let i = 0; i < wallets.length; i++) {
      await processWallet(i, wallets[i], proxies[i]);
    }

    console.log(colors.blue("Xử lý hoàn tất, chờ 60 phút để tiếp tục..."));
    await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
  }
};

main();
