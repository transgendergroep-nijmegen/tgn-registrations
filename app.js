firebase.initializeApp({
  apiKey: "AIzaSyDKHQLQH4xyuKMfVAlEhqvng9-mm0K-ieI",
  authDomain: "tgn-registrations.firebaseapp.com",
  databaseURL: "https://tgn-registrations.firebaseio.com/",
});

angular
  .module("tgn-registrations", ["firebase"])
  .controller("RegistrationsCtrl", ($scope, $firebaseAuth, $firebaseArray) => {
    $scope.authObj = $firebaseAuth();
    $scope.events = $firebaseArray(firebase.database().ref("events"));
    $scope.users = $firebaseArray(firebase.database().ref("users"));

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
          $scope.showTab("events");
        })
        .catch($scope.show_toast);
    };

    $scope.forgotpassword = (form) => {
      if (!form.email) {
        $scope.show_toast(
          "Vul een e-mailadres in om je wachtwoord te resetten."
        );
      } else {
        $scope.authObj
          .$sendPasswordResetEmail(form.email)
          .then((user) => {
            $scope.show_toast(
              "Er is naar het ingevulde adres een e-mail verstuurd met instructies om je wachtwoord te resetten."
            );
          })
          .catch($scope.show_toast);
      }
    };

    $scope.show_toast = (text) => {
      $scope.toast_text = text;
      $(".toast").toast("show");
    };

    $scope.signin = (form) => {
      $scope.authObj
        .$signInWithEmailAndPassword(form.email, form.password)
        .then((user) => {
          $scope.showTab("events");
        })
        .catch($scope.show_toast);
    };

    $scope.signout = () => {
      $scope.authObj.$signOut();
      $scope.showTab("events");
    };

    $scope.showTab = (tab) => {
      $('.nav-tabs a[href="#' + tab + '"]').tab("show");
    };

    $scope.assign = (varName, value) => {
      $scope[varName] = value;
    };

    $scope.setinfo = (form) => {
      $scope.authObj
        .$signInWithEmailAndPassword($scope.user.email, form.password)
        .then((user) => {
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
            .catch($scope.show_toast);
        })
        .catch($scope.show_toast);
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
        .$signInWithEmailAndPassword($scope.user.email, form.password.old)
        .then((user) => {
          $scope.authObj
            .$updatePassword(form.password.new)
            .then(() => {
              $scope.setView("main");
            })
            .catch($scope.show_toast);
        })
        .catch($scope.show_toast);
    };

    $scope.deleteaccount = (form) => {
      $scope.authObj
        .$signInWithEmailAndPassword($scope.user.email, form.password)
        .then((user) => {
          $scope.authObj
            .$deleteUser()
            .then(() => {
              $scope.setView("main");
            })
            .catch($scope.show_toast);
        })
        .catch($scope.show_toast);
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

    $scope.setForm = (value) => {
      $scope.form = value;
    };
  });

// jQuery(document).ready(($) => {
//   // Add functionality to de-active navbar links after clicking.
//   $("[data-toggle=tab]").click(function () {
//     if ($(this).hasClass("active")) {
//       $(this).removeClass("active"); // disable navbar link
//       $($(this).attr("href")).removeClass("active"); // disable tab content
//       return false; // keep link from being activated by the same click
//     }
//   });
// });
