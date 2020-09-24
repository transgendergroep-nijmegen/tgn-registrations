firebase.initializeApp({
  apiKey: "AIzaSyDKHQLQH4xyuKMfVAlEhqvng9-mm0K-ieI",
  authDomain: "tgn-registrations.firebaseapp.com",
  databaseURL: "https://tgn-registrations.firebaseio.com/",
});

angular
  .module("tgn-registrations", ["firebase"])
  .controller(
    "RegistrationsCtrl",
    (
      $scope,
      $interval,
      $filter,
      $firebaseAuth,
      $firebaseObject,
      $firebaseArray
    ) => {
      $scope.authObj = $firebaseAuth();
      $scope.admins = $firebaseObject(firebase.database().ref("admins"));
      $scope.events = $firebaseArray(firebase.database().ref("events"));

      // Get admin data.
      $scope.users = $firebaseObject(firebase.database().ref("users"));
      $scope.usersArray = $firebaseArray(firebase.database().ref("users"));

      $interval(() => {
        $scope.now = Date.now();
      }, 1000);

      $scope.authObj.$onAuthStateChanged((user) => {
        $scope.user = user;
        if (user) {
          // Set $scope.userInfo.
          $firebaseObject(firebase.database().ref(`users/${user.uid}`))
            .$loaded()
            .then((data) => {
              $scope.userInfo = data;
            });

          // Start email verification check routine.
          let emailVerificationInterval = $interval(() => {
            $scope.user?.reload().then(() => {
              if ($scope.user?.emailVerified) {
                $scope.$apply();
                $interval.cancel(emailVerificationInterval);
              }
            });
          }, 1000);
        }
      });

      $scope.register = (form) => {
        $scope.working = true;
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
            $scope.show_toast(
              "Account aangemaakt. Er is naar het ingevulde adres een e-mail verstuurd met instructies om de registratie te voltooien."
            );
            $scope.working = false;
          })
          .catch($scope.show_toast);
      };

      $scope.forgotpassword = (form) => {
        if (!form.email) {
          $scope.show_toast(
            "Vul een e-mailadres in om je wachtwoord te resetten."
          );
        } else {
          $scope.working = true;
          $scope.authObj
            .$sendPasswordResetEmail(form.email)
            .then((user) => {
              $scope.show_toast(
                "Er is naar het ingevulde adres een e-mail verstuurd met instructies om je wachtwoord te resetten."
              );
              $scope.working = false;
            })
            .catch($scope.show_toast);
        }
      };

      $scope.show_toast = (text) => {
        $scope.toast_text = text;
        $(".toast").toast("show");
        $scope.working = false;
      };

      $scope.signin = (form) => {
        $scope.working = true;
        $scope.authObj
          .$signInWithEmailAndPassword(form.email, form.password)
          .then((user) => {
            $scope.showTab("events");
            $scope.working = false;
          })
          .catch($scope.show_toast);
      };

      $scope.signout = () => {
        $scope.authObj.$signOut();
        $scope.showTab("events");
      };

      $scope.setinfo = (form) => {
        $scope.working = true;
        $scope.authObj
          .$signInWithEmailAndPassword($scope.user.email, form.password)
          .then((user) => {
            $scope.authObj
              .$updateEmail(form.email)
              .then(() => {
                user.sendEmailVerification();
                $scope.setUserInfo($scope.user, {
                  email: form.email,
                  name: form.name,
                  phone: form.phone,
                });
                $scope.showTab("events");
                $scope.working = false;
              })
              .catch($scope.show_toast);
          })
          .catch($scope.show_toast);
      };

      $scope.setUserInfo = (user, userInfo) => {
        $scope.working = true;
        firebase
          .database()
          .ref(`users/${user.uid}`)
          .set(userInfo)
          .then(() => {
            $scope.userInfo = userInfo;
            $scope.working = false;
          })
          .catch($scope.show_toast);
      };

      $scope.setpassword = (form) => {
        $scope.working = true;
        $scope.authObj
          .$signInWithEmailAndPassword($scope.user.email, form.password.old)
          .then((user) => {
            $scope.authObj
              .$updatePassword(form.password.new)
              .then(() => {
                $scope.showTab("events");
                $scope.working = false;
              })
              .catch($scope.show_toast);
          })
          .catch($scope.show_toast);
      };

      $scope.set_user_event_status = (uid, event, status) => {
        $scope.working = true;
        let date_text = $filter("date")(event.date * 1000, "dd/MM/yyyy");
        let you_are = uid === $scope.user.uid ? "Je bent" : "De account is";
        if (status)
          $scope.show_toast(
            `${you_are} nu ingeschreven voor '${event.name}' op ${date_text}.`
          );
        else
          $scope.show_toast(
            `${you_are} nu uitgeschreven voor '${event.name}' op ${date_text}.`
          );
        firebase
          .database()
          .ref(`events/${event.$id}/signups/${uid}`)
          .set(status)
          .then(() => {
            $scope.working = false;
            $scope.$apply();
          })
          .catch($scope.show_toast);
      };

      $scope.newevent = (event) => {
        $scope.working = true;
        $scope.events
          .$add(event)
          .then(() => {
            let date_text = $filter("date")(event.date * 1000, "dd/MM/yyyy");
            $scope.show_toast(
              `Activiteit '${event.name}' op ${date_text} is aangemaakt.`
            );
            $scope.form = null;
            $scope.working = false;
          })
          .catch($scope.show_toast);
      };

      $scope.editevent = (event) => {
        $scope.working = true;
        let index = $scope.events.$indexFor(event.$id);
        $scope.events[index] = event;
        $scope.events
          .$save(index)
          .then(() => {
            let date_text = $filter("date")(event.date * 1000, "dd/MM/yyyy");
            $scope.show_toast(
              `Activiteit '${event.name}' op ${date_text} is gewijzigd.`
            );
            $scope.working = false;
          })
          .catch($scope.show_toast);
      };

      $scope.deleteevent = (event) => {
        $scope.working = true;
        let index = $scope.events.$indexFor(event.$id);
        $scope.events
          .$remove(index)
          .then(() => {
            let date_text = $filter("date")(event.date * 1000, "dd/MM/yyyy");
            $scope.show_toast(
              `Activiteit '${event.name}' op ${date_text} is verwijderd.`
            );
            $scope.edit_event = null;
            $scope.working = false;
          })
          .catch($scope.show_toast);
      };

      $scope.edituser = (user) => {
        if (user.admin !== null) {
          $scope.admins[user.$id] = user.admin;
          $scope.admins.$save(user.$id);
          user.admin = null;
        }
        let index = $scope.usersArray.$indexFor(user.$id);
        $scope.usersArray[index] = user;
        $scope.usersArray
          .$save(index)
          .then(() => {
            $scope.show_toast(`Account '${user.email}' is gewijzigd.`);
          })
          .catch($scope.show_toast);
      };

      $scope.deleteaccount = (form) => {
        $scope.working = true;
        $scope.authObj
          .$signInWithEmailAndPassword($scope.user.email, form.password)
          .then((user) => {
            let index = $scope.usersArray.$indexFor(user.uid);
            $scope.usersArray
              .$remove(index)
              .then(() => {
                $scope.authObj
                  .$deleteUser()
                  .then(() => {
                    $scope.show_toast(`Account '${user.email}' is verwijderd.`);
                    $scope.showTab("events");
                    $scope.working = false;
                  })
                  .catch($scope.show_toast);
              })
              .catch($scope.show_toast);
          })
          .catch($scope.show_toast);
      };

      $scope.showTab = (tab) => {
        $('.nav-tabs a[href="#' + tab + '"]').tab("show");
      };

      $scope.assign = (varName, value) => {
        $scope[varName] = value;
      };

      $scope.count_event_signups = (event) =>
        (event.fake_signups ?? 0) + Object.keys(event.signups ?? []).length;

      $scope.eventListName = (event) =>
        `${$filter("date")(event.date * 1000, "dd/MM/yyyy")} - ${event.name}`;

      $scope.copy = (obj) => Object.assign({}, obj);
    }
  )
  .directive("bindTimestamp", function () {
    return {
      restrict: "A",
      require: "ngModel",
      link: function (scope, element, attrs, ngModel) {
        if (ngModel) {
          ngModel.$parsers.push(function (value) {
            return Math.floor(new Date(value).getTime() / 1000);
          });

          ngModel.$formatters.push(function (value) {
            return new Date(value * 1000);
          });
        }
      },
    };
  });
