import {Component, Input, OnInit} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {Router} from '@angular/router';
import {NgxUiLoaderService} from 'ngx-ui-loader';
import {FirebaseServiceService} from '../../services/firebase-service.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Input() page;
  currentRole;

  constructor(private auth: AngularFireAuth,
              private ngxService: NgxUiLoaderService,
              public fbService: FirebaseServiceService,
              private router: Router) { }

  ngOnInit(): void {
    this.currentRole = this.fbService.currentRole();
    console.log(this.currentRole);
  }
  onLogout(): void {
    this.ngxService.start();
    this.auth.signOut().then(() => {
      this.ngxService.stop();
      this.router.navigate(['/login']);
    });
  }
}
