var express = require("express");
var admin = require("firebase-admin");

var serviceAccount = require("./twe-mobile-firebase-adminsdk-tpb1s-5b3b6b718b.json");

const port = process.env.PORT || 3000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://twe-mobile-default-rtdb.firebaseio.com",
});

const bootServer = () => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  //Use Apis v1
  app.post("/notifications", async (req, res, next) => {
    try {
      var message = {
        notification: {
          title: req.body.title,
          body: req.body.content,
        },
      };
      const uids = req.body.uids;

      var tokenPromise = uids.map(async (uid) => {
        var user = await admin.firestore().collection("users").doc(uid).get();
        return user.data().fcmToken;
      });

      let tokens = await Promise.all(tokenPromise);

      admin
        .messaging()
        .sendToDevice(tokens, message)
        .then((response) => {
          // Response is a message ID string.
          console.log("Successfully sent message:", response);
          res.status(200).json("Send Successfully");
        })
        .catch((error) => {
          console.log("Error sending message:", error);
        });
    } catch (error) {
      next(error);
    }
  });

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
};

bootServer();
