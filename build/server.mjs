import express from "express";
import bodyParser from "body-parser";
import path from "path";
import ethUtil from "ethereumjs-utils";

// interface User {
//     publicAdress?: string,
//     username?: string,
//     nonce: number,
// }

const addressRegistry = {};
const sessionRegistry = {};

function generateNonce() {
    return Math.floor(Math.random() * 100000000000000);
}

function generateUser(publicAddress) {
    if (!publicAddress) throw new Error('missing address to generate user');
    return {
        publicAdress: publicAddress,
        username: undefined,
        nonce: generateNonce()
    }
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function generateSessionToken(publicAddress) {
    const token = uuidv4();
    sessionRegistry[token] = publicAddress;
    return token;
}

function verifySignature(signature, nonce, publicAddress) {
    const msg = `Signing nonce, "${nonce}"`;

    const msgBuffer = ethUtil.toBuffer(msg);
    const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
    const signatureBuffer = ethUtil.toBuffer(signature);
    const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
    const publicKey = ethUtil.ecrecover(
        msgHash,
        signatureParams.v,
        signatureParams.r,
        signatureParams.s
    );
    const addressBuffer = ethUtil.publicToAddress(publicKey);
    const address = ethUtil.bufferToHex(addressBuffer);

    // ecrecover matches the initial publicAddress
    if (address.toLowerCase() === publicAddress.toLowerCase()) {
        return true;
    } else {
        return false;
    }
}

function invalidateSession(sessionId) {
    delete sessionRegistry[sessionId];
}

function createServer() {

    const app = express()
    const port = 3000;

    app.use(bodyParser.json());

    app.use(express.static(path.resolve('./public')));

    app.post('/nonce', (req, res) => {
        const publicAddress = req.body.address;

        if (publicAddress) {
            const user = addressRegistry[publicAddress] || generateUser(publicAddress);
            addressRegistry[publicAddress] = user;

            const nonce = user.nonce;

            res.send({
                nonce: nonce
            });
        } else {
            res.send({
                error: "missing public address",
            });
        }
    });

    app.post('/auth', (req, res) => {
        const { signature, address } = req.body;

        const user = addressRegistry[address];
        const nonce = user.nonce;

        const verified = verifySignature(signature, nonce, address);

        if (verified) {
            // send session token
            res.send({
                error: null,
                session: generateSessionToken(address)
            });
        } else {
            res.send({ error: 'not authenticated' });
        }

        user.nonce = generateNonce();
    });

    app.post('/logout', (req, res) => {
        const { sessionId } = req.body;
        invalidateSession(sessionId);
    });

    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`);
    });

}

createServer();
