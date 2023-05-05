import {Injectable, NgZone} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
const USER_STATUS = 'userStatus';

@Injectable({
  providedIn: 'root'
})
export class FirebaseServiceService {

  constructor(private ngZone: NgZone, private afAuth: AngularFireAuth,
              private firestore: AngularFirestore , private router: Router) { }

  public currentUser: any;
  public userStatus: string;
  // @ts-ignore
  public userStatusChanges: BehaviorSubject<string> = new BehaviorSubject<string>(this.userStatus);


  setUserStatus(userStatus: any): void {
    this.userStatus = userStatus;
    this.saveUserStatus(JSON.stringify(userStatus));
    this.userStatusChanges.next(userStatus);
  }
  saveUserStatus(userStatus): void {
    localStorage.setItem(USER_STATUS, userStatus);
  }
  getUserStatus(): any {
    return JSON.parse(localStorage.getItem(USER_STATUS));
  }
  isAdmin(): boolean {
    const userStatus = this.getUserStatus();
    return userStatus.role === 'admin';
  }
  currentRole(): any {
    const userStatus = this.getUserStatus();
    return userStatus.role;
  }
  signUp(email: string, password: string, role: string): void{


    this.afAuth.createUserWithEmailAndPassword(email, password)
      .then((userResponse) => {
        // add the user to the "users" database
        const user = {
          id: userResponse.user.uid,
          username: userResponse.user.email,
          role: role,
        };

        // add the user to the database
        this.firestore.collection('users').add(user)
          // tslint:disable-next-line:no-shadowed-variable
          .then(user => {
            user.get().then(x => {
              // return the user data
              console.log(x.data());
              this.currentUser = x.data();
              this.setUserStatus(this.currentUser);
              this.router.navigate(['/']);
            });
          }).catch(err => {
          console.log(err);
        });


      })
      .catch((err) => {
        console.log('An error ocurred: ', err);
      });

  }

  // tslint:disable-next-line:typedef
  login(email: string, password: string) {
    return new Promise((res, rej) => {
      this.afAuth.signInWithEmailAndPassword(email, password)
        .then((user) => {
          this.firestore.collection('users').ref.where('username', '==', user.user.email).onSnapshot(snap => {
            snap.forEach(userRef => {
              console.log('userRef', userRef.data());
              this.currentUser = userRef.data();
              console.log(this.currentUser);
              // setUserStatus
              this.setUserStatus(this.currentUser);
              // @ts-ignore
              // if (userRef.data().role !== 'admin') {
              //   this.router.navigate(['/']);
              // }else{
              //   this.router.navigate(['/admin']);
              // }
              res({
                currentUser: this.currentUser
              });
            });
          });
        }).catch(err => {
        console.log(err);
        rej(err);
      });
    });
  }

  // tslint:disable-next-line:typedef
  logOut(){
    this.afAuth.signOut()
      .then(() => {
        console.log('user signed Out successfully');
        // set current user to null to be logged out
        this.currentUser = null;
        // set the listenener to be null, for the UI to react
        this.setUserStatus(null);
        localStorage.removeItem(USER_STATUS);
        this.ngZone.run(() => this.router.navigate(['/login']));

      }).catch((err) => {
      console.log(err);
    });
  }


  // tslint:disable-next-line:typedef
  userChanges(){
    this.afAuth.onAuthStateChanged(currentUser => {
      if (currentUser){
        this.firestore.collection('users').ref.where('username', '==', currentUser.email).onSnapshot(snap => {
          snap.forEach(userRef => {
            this.currentUser = userRef.data();
            // setUserStatus
            this.setUserStatus(this.currentUser);
            console.log(this.userStatus);

            // @ts-ignore
            if (userRef.data().role !== 'admin') {
              this.ngZone.run(() => this.router.navigate(['/']));
            }else{
              this.ngZone.run(() => this.router.navigate(['/admin']));
            }
          });
        });
      }else{
        this.ngZone.run(() => this.router.navigate(['/login']));
      }
    });
  }
  getPassword(): string {
    return
  }
}
