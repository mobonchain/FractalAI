import axios from "axios";
import colors from "colors";
import Web3 from "web3";
import fs from "fs/promises";
import { HttpsProxyAgent } from "https-proxy-agent";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const login = async (privateKey, proxy) => {
  const web3 = new Web3(new Web3.providers.HttpProvider("https://sepolia.infura.io"));
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);

  const httpsAgent = proxy ? new HttpsProxyAgent(proxy) : null;

  const getNonce = await axios.get("https://dapp-backend-large.fractionai.xyz/api3/auth/nonce", {
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

  const loginData = await axios.post("https://dapp-backend-large.fractionai.xyz/api3/auth/verify", payload, {
    headers: {
      "Content-Type": "application/json",
    },
    httpsAgent,
  });

  return loginData.data;
};

const joinSpace = async (bearer, id, proxy) => {
  const httpsAgent = proxy ? new HttpsProxyAgent(proxy) : null;

  const getAiagent = await axios.get(`https://dapp-backend-large.fractionai.xyz/api3/agents/user/${id}`, {
    headers: {
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
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

const processWallet = async (walletIndex, privateKey, proxy) => {
  try {
    const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : "0x" + privateKey;


    const proxyUrl = new URL(proxy); 
    const ipAddress = proxyUrl.hostname;  

    console.log(colors.cyan(`Ví ${walletIndex + 1} [IP: ${ipAddress}]: Đang xử lý...`));

    const getLogin = await login(formattedPrivateKey, proxy);
    const getAiagent = await joinSpace(getLogin.accessToken, getLogin.user.id, proxy);

    console.log(colors.green(`Ví ${walletIndex + 1} [IP: ${ipAddress}]: Đăng nhập thành công với địa chỉ: ${getLogin.user.walletAddress}`));
    console.log(colors.green(`Ví ${walletIndex + 1} [IP: ${ipAddress}]: Số lượng AI Agent: ${getAiagent.aiagentId.length}`));

    for (let j = 0; j < getAiagent.aiagentId.length; j++) {
      const aiagentId = getAiagent.aiagentId[j];
      const agentName = getAiagent.nameAgent[j];
      try {
        const joinSpaceResponse = await axios.post(
          `https://dapp-backend-large.fractionai.xyz/api3/matchmaking/initiate`,
          {
            userId: getLogin.user.id,
            agentId: aiagentId,
            entryFees: 0.0001,
            sessionTypeId: 1,
          },
          {
            headers: {
              Authorization: `Bearer ${getLogin.accessToken}`,
              "Content-Type": "application/json",
            },
            httpsAgent: proxy ? new HttpsProxyAgent(proxy) : null,
          }
        );

        if (joinSpaceResponse.status === 200) {
          console.log(colors.green(`Ví ${walletIndex + 1} [IP: ${ipAddress}]: Tham gia Rap Battle thành công với Agent: ${agentName} (ID: ${aiagentId})`));
        }
      } catch (error) {
        console.log(
          colors.yellow(
            `Ví ${walletIndex + 1} [IP: ${ipAddress}]: Tham gia thất bại với Agent: ${agentName} (ID: ${aiagentId}), Lý do: ${error.response?.data?.error || error.message}`
          )
        );
      }
    }
  } catch (error) {
    console.error(colors.red(`Ví ${walletIndex + 1} [IP: ${proxy}]: Lỗi: ${error.message}`));
  }
};

const main = async () => {
  console.log(colors.blue("Khởi động chương trình Fractal Rap Battle..."));

  const wallets = (await fs.readFile("wallet.txt", "utf-8"))
    .replace(/\r/g, "")
    .split("\n")
    .filter(Boolean);

  const proxies = (await fs.readFile("proxy.txt", "utf-8"))
    .replace(/\r/g, "")
    .split("\n")
    .filter(Boolean);

  if (wallets.length > proxies.length) {
    console.error(colors.red("Lỗi: Không đủ proxy cho tất cả địa chỉ ví!"));
    return;
  }

  while (true) {
    console.log(colors.blue("Bắt đầu xử lý các ví..."));

    await Promise.all(
      wallets.map((privateKey, index) => processWallet(index, privateKey, proxies[index]))
    );

    console.log(colors.blue("Hoàn thành xử lý, chờ 20 phút cho lần tiếp theo..."));
    await delay(20 * 60 * 1000);
  }
};

main();
