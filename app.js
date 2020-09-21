firebase.initializeApp({
  apiKey: "AIzaSyDKHQLQH4xyuKMfVAlEhqvng9-mm0K-ieI",
  authDomain: "tgn-registrations.firebaseapp.com",
  databaseURL: "https://tgn-registrations.firebaseio.com/",
});

angular
  .module("tgn-registrations", ["firebase"])
  .controller("RegistrationsCtrl", ($scope, $firebaseAuth, $firebaseArray) => {
    $scope.view = "main";
    $scope.authObj = $firebaseAuth();
    $scope.events = $firebaseArray(firebase.database().ref("events"));

    $scope.Object = Object;

    $scope.authObj.$onAuthStateChanged((user) => {
      $scope.user = user;
      if (user)
        $firebaseArray(
          firebase.database().ref(`users/${user.uid}/info_history`)
        )
          .$loaded()
          .then((userInfoHistory) => {
            $scope.userInfo = userInfoHistory[userInfoHistory.length - 1];
          });
    });

    $scope.setView = (view) => {
      $scope.errormsg = null;
      $scope.view = view;
    };

    $scope.register = (form) => {
      $scope.authObj
        .$createUserWithEmailAndPassword(form.email, form.password)
        .then((user) => {
          user.sendEmailVerification();
          $scope.setUserInfo(user, {
            email: form.email,
            name: form.name,
            phone: form.phone,
          });
          $scope.setView("main");
        })
        .catch((error) => {
          $scope.errormsg = error;
        });
    };

    $scope.forgotpassword = (form) => {
      if (!form.email)
        $scope.errormsg =
          "Vul een e-mailadres in om je wachtwoord te resetten.";
      else {
        $scope.authObj
          .$sendPasswordResetEmail(form.email)
          .then((user) => {
            $scope.errormsg =
              "Er is naar het ingevulde adres een e-mail verstuurd met instructies om je wachtwoord te resetten.";
          })
          .catch((error) => {
            $scope.errormsg = error;
          });
      }
    };

    $scope.signin = (form) => {
      $scope.authObj
        .$signInWithEmailAndPassword(form.email, form.password)
        .then((user) => {
          $scope.setView("main");
        })
        .catch((error) => {
          $scope.errormsg = error;
        });
    };

    $scope.setinfo = (form) => {
      $scope.authObj
        .$updateEmail(form.email)
        .then(() => {
          $scope.setUserInfo($scope.user, {
            email: form.email,
            name: form.name,
            phone: form.phone,
          });
          $scope.setView("main");
        })
        .catch((error) => {
          $scope.errormsg = error;
        });
    };

    $scope.setUserInfo = (user, userInfo) => {
      let userInfoHistory = $firebaseArray(
        firebase.database().ref(`users/${user.uid}/info_history`)
      );
      userInfoHistory.$add(userInfo);
      $scope.userInfo = userInfo;
    };

    $scope.setpassword = (form) => {
      $scope.authObj
        .$updatePassword(form.password)
        .then(() => {
          $scope.setView("main");
        })
        .catch((error) => {
          $scope.errormsg = error;
        });
    };

    $scope.set_user_event_status = (user, event, status) => {
      firebase
        .database()
        .ref(`events/${event.$id}/signups/${user.uid}`)
        .set(status);
    };

    $scope.count_event_signups = (event) => {
      return event.fake_signups + Object.keys(event.signups ?? []).length;
    };
  });
