
function handleAdressSelected(address) {
    post('/nonce', {
        address: address
    }).then(json => {
        const nonce = json.nonce;

        ethereum.sendAsync({
            method: 'personal_sign',
            from: ethereum.selectedAddress,
            params: [
                `Signing nonce, "${nonce}"`,
                ethereum.selectedAddress
            ]
        }, (err, result) => {
            if (err) return console.error(err);
            if (result.warning) console.warn(result.warning);
            if (result.result) {
                const sig = result.result;
                handleSignedNonce(sig, ethereum.selectedAddress)
            }
        })

    })
}

function handleSignedNonce(sig, publicAddress) {
    post('/auth', {
        address: publicAddress,
        signature: sig,
    }).then(json => {
        if(json.error) {
            console.error(json.error);
        } else {
            const sessionToken = json.session;
            localStorage["sessionId"] = sessionToken;
            postLogin();
        }
    })
}

function recoverSession(sessionId, publicAddress) {
    // nothin happens, its just "logged in"
    // check if session is still valid
}

function login() {
    if (web3) {
        ethereum.enable().then(([selectedAddress]) => {
            handleAdressSelected(selectedAddress);
        })
    } else {
        throw new Error('MetaMask not installed.');
    }
}

function logout() {
    post('/logout', {
        sessionId: localStorage["sessionId"],
    })

    localStorage.removeItem('sessionId');
    location.reload();
}

function post(endpoint, body) {
    return fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(res => res.json())
    .catch(err => {
        console.error(err);
    });
}

function postLogin() {
    const btn2 = document.createElement('div');
    btn2.innerHTML = "Logged in";
    document.body.append(btn2);

    const btn3 = document.createElement('button');
    btn3.onclick = () => {
        logout()
    }
    btn3.innerHTML = "Logout";
    document.body.append(btn3);
}

function main() {
    if(!('ethereum' in window)) {
        const btn2 = document.createElement('div');
        btn2.innerHTML = "Login not possbile";
        document.body.append(btn2);
    } else 

    if(localStorage["sessionId"] && ethereum.selectedAddress) {
        recoverSession(localStorage["sessionId"], ethereum.selectedAddress);
        postLogin();

    } else if(localStorage["sessionId"] && !ethereum.selectedAddress) {
        localStorage["sessionId"] = null;

    } else if (ethereum.selectedAddress) {
        const btn = document.createElement('button');
        btn.onclick = () => {
            handleAdressSelected(ethereum.selectedAddress);
        }
        btn.innerHTML = "Login with selecetd address";
        document.body.append(btn);
        
    } else {
        const btn = document.createElement('button');
        btn.onclick = () => {
            login()
        }
        btn.innerHTML = "Login";
        document.body.append(btn);
    }
}

window.addEventListener('load', main);
