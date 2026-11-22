module.exports = function adminAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const encoded = header.replace("Basic ", "");
  const [user, pass] = Buffer.from(encoded, "base64").toString().split(":");

  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    return next();
  }

  res.set("WWW-Authenticate", 'Basic realm="admin"');
  res.status(401).send("Login diperlukan");
};