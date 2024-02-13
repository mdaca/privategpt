import jwt_decode from "jwt-decode";

//const verifyToken = (token) => { var ret = jwt_decode.jwtDecode(token); console.log(ret); return ret; };

function verifyToken(token1) {
    var ret = jwt_decode(token); console.log(ret); return ret;
}

export default { verifyToken };