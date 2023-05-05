import { Component, OnInit } from '@angular/core';
import {NgForm} from '@angular/forms';
import {AngularFirestore} from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import {FirebaseServiceService} from '../../../services/firebase-service.service';
import {NgxUiLoaderService} from 'ngx-ui-loader';
import {ToastrService} from 'ngx-toastr';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private fbService: FirebaseServiceService,
              private toastr: ToastrService,
              private router: Router,
              private ngxService: NgxUiLoaderService) { }

  ngOnInit(): void {
  }
  onLogin(form: NgForm): void {
    this.ngxService.start();
    const {email, password} = form.value;
    this.fbService.login(email, password).then((data) => {
      this.ngxService.stop();
      this.router.navigate(['/']);
    }, (err) => {
      this.ngxService.stop();
      this.toastr.error(err.message, 'Error', {
        timeOut: 3000,
      });
    });
  }
}
