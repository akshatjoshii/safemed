import { Component, OnInit } from '@angular/core';
import {NgForm} from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';
import {FirebaseServiceService} from '../../../services/firebase-service.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  constructor(public firebaseService: FirebaseServiceService) { }

  ngOnInit(): void {
  }
  onLogin(form: NgForm): void {
    console.log(form.value);
    const {email, password, role} = form.value;
    this.firebaseService.signUp(email, password, role);
  }
}
