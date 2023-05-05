import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import * as moment from 'moment';
import {DashboardService} from '../../services/dashboard.service';
import {NgxUiLoaderService} from 'ngx-ui-loader';
import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import {Router} from '@angular/router';
import { DOCUMENT } from '@angular/common';
import {ToastrService} from 'ngx-toastr';
import {FirebaseServiceService} from '../../services/firebase-service.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Models for Input fields
  // collectionRef.where("startTime", ">=", "1506816000").where("startTime", "<=", "1507593600")
  currentRole: any;
  selectedMailbackForm: any;
  closeResult = '';
  selectedDateRange;
  @ViewChild('content', {static: false}) content;
  selectedStatus = '';
  searchEmail = '';
  selectedState = '';
  statuses = [
    { value: 'Not Started', label: 'Not Started' },
    { value: 'Pending Processing', label: 'Pending Processing' },
    { value: 'EnvSentToReq', label: 'EnvSentToReq' },
    { value: 'EnvRcvdAt123', label: 'EnvRcvdAt123' },
    { value: 'Destructed', label: 'Destructed' },
    { value: 'Override', label: 'Override' },
    { value: 'Not Response', label: 'No Response'}
  ];
  states = [
    { value: 'MA', label: 'MA' },
    { value: 'CA', label: 'CA' }
  ];
  query;
  deletePopover = {
    popoverTitle: 'Confirmation Required',
    popoverMessage: 'Are you sure you want to delete this?',
    confirmClicked : false,
    cancelClicked : false,
  };
  limit = 25;
  // Data object for listing items
  tableData: any[] = [];

  // Save first document in snapshot of items received
  firstInResponse: any = [];
  // Save last document in snapshot of items received
  lastInResponse: any = [];
  // Keep the array of first document of previous pages
  // tslint:disable-next-line:variable-name
  prev_strt_at: any = [];
  // Maintain the count of clicks on Next Prev button
  // tslint:disable-next-line:variable-name
  pagination_clicked_count = 0;
  // Disable next and prev buttons
  // tslint:disable-next-line:variable-name
  disable_next = false;
  // tslint:disable-next-line:variable-name
  disable_prev = false;

  constructor(public firestore: AngularFirestore,
              private auth: AngularFireAuth,
              private dashboardService: DashboardService,
              private modalService: NgbModal,
              private router: Router,
              @Inject(DOCUMENT) private document: Document,
              private toastr: ToastrService,
              public fbService: FirebaseServiceService,
              private ngxService: NgxUiLoaderService) {
  }
  resetVariables(): void {
    this.tableData = [];
    this.firstInResponse = [];
    this.lastInResponse = [];

    this.prev_strt_at = [];
    this.pagination_clicked_count = 0;
    this.disable_next = false;
    this.disable_prev = false;
  }

  onRef(): any {
    const query = this.dashboardService.onRef(this.searchEmail, this.selectedDateRange,
      this.selectedStatus, this.selectedState, this.limit);
    return query;
  }
  onCreateDummy(): any {
    // tslint:disable-next-line:typedef
    function randomDate(start, end) {
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }
    // this.firestore.collection('mailbackForm').add({
    //   address: 'Hoyle road',
    //   address2: 'Random address',
    //   city: 'USA',
    //   createdAt: randomDate(new Date(2021, 3, 1), new Date(2021, 3, 20)).getTime(),
    //   firstName: 'Aditya',
    //   lastName: 'K',
    //   state: 'CA',
    //   uniqueId: 'CA121232323@aditya@gmail.com',
    //   units: 1,
    //   yourEmail: 'aditya@gmail.com',
    //   zipCode: '01001',
    //   monthYear: '4-2021',
    //   dateRecDat123: null,
    //   dateSentToREQ: null,
    //   deasn: null,
    //   status: 'Not Started',
    //   notes: null,
    //   uspsTracking: null
    // }).then((data) => {});
  }
  onSearch(): any {
    this.ngxService.start();
    this.resetVariables();
    // tslint:disable-next-line
    let query = this.onRef();
    this.firestore.collection('mailbackForm', ref => query).snapshotChanges()
      .subscribe(response => {
        if (!response.length) {
          console.log('No Data Available');
          this.ngxService.stop();
          return false;
        }
        this.firstInResponse = response[0].payload.doc;
        this.lastInResponse = response[response.length - 1].payload.doc;

        this.tableData = [];
        for (const item of response) {
          // tslint:disable-next-line
          this.tableData.push({
            id: item.payload.doc.id,
            data: item.payload.doc.data()
          });
        }

        // Initialize values
        this.prev_strt_at = [];
        this.pagination_clicked_count = 0;
        this.disable_next = false;
        this.disable_prev = false;

        // Push first item to use for Previous action
        this.push_prev_startAt(this.firstInResponse);
        console.log(this.tableData);
        if (response.length < this.limit) {
          this.disable_next = true;
        }
        this.ngxService.stop();
      }, error => {
        console.log(error);
        this.ngxService.stop();
      });
  }
  onReset(): void {
    this.document.defaultView.location.reload();
    // this.selectedDateRange = '';
    // this.resetVariables();
    // this.onInit();
  }

  onInit(): void {
    this.currentRole = this.fbService.currentRole();
    this.ngxService.start();
    this.defaultQuery().snapshotChanges()
      .subscribe(response => {
        if (!response.length) {
          console.log('No Data Available');
          this.ngxService.stop();
          return false;
        }
        this.firstInResponse = response[0].payload.doc;
        this.lastInResponse = response[response.length - 1].payload.doc;

        this.tableData = [];
        for (const item of response) {
          this.tableData.push({
            id: item.payload.doc.id,
            data: item.payload.doc.data()
          });
        }

        // Initialize values
        this.prev_strt_at = [];
        this.pagination_clicked_count = 0;
        this.disable_next = false;
        this.disable_prev = false;

        // Push first item to use for Previous action
        this.push_prev_startAt(this.firstInResponse);
        console.log(this.tableData);
        this.ngxService.stop();
      }, error => {
        console.log(error);
        this.ngxService.stop();
      });
  }
  onMailback(id, index): any {
    this.ngxService.start();
    this.dashboardService.onMailbackDocumentRead(id).get()
      .subscribe((data) => {
        console.log(data);
        console.log(data.data());
        this.selectedMailbackForm = {
          id,
          data: data.data()
        };
        // Rendering In Modal: formatting milliseconds to date for calendar view, will be changed to milliseconds before save
        if (this.selectedMailbackForm.data.dateRecDat123 && !isNaN(this.selectedMailbackForm.data.dateRecDat123 - 0)) {
          this.selectedMailbackForm.data.dateRecDat123 =  {
            startDate: moment(this.selectedMailbackForm.data.dateRecDat123),
            endDate: moment(this.selectedMailbackForm.data.dateRecDat123)
          };
        }
        if (this.selectedMailbackForm.data.dateSentToREQ && !isNaN(this.selectedMailbackForm.data.dateSentToREQ - 0)) {
          this.selectedMailbackForm.data.dateSentToREQ =  {
            startDate: moment(this.selectedMailbackForm.data.dateSentToREQ),
            endDate: moment(this.selectedMailbackForm.data.dateSentToREQ)
          };
        }




        // modal is triggered to open and callbacks to handle save and cancel are handled below
        this.modalService.open(this.content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
          this.closeResult = `Closed with: ${result}`;
          if (result === 'Save click') {
            // @ts-ignore
            const dateRec = document.getElementById('dateRec').value;
            this.selectedMailbackForm.data.dateRecDat123 = !dateRec ? null : this.selectedMailbackForm.data.dateRecDat123;
            if (this.selectedMailbackForm.data.dateRecDat123 && this.selectedMailbackForm.data.dateRecDat123.endDate) {
              this.selectedMailbackForm.data.dateRecDat123 = this.selectedMailbackForm.data.dateRecDat123.endDate.valueOf();
            } else {
              this.selectedMailbackForm.data.dateRecDat123 = null;
            }

            // @ts-ignore
            const dateSent = document.getElementById('dateSent').value;
            this.selectedMailbackForm.data.dateSentToREQ = !dateSent ? null : this.selectedMailbackForm.data.dateSentToREQ;
            if (this.selectedMailbackForm.data.dateSentToREQ && this.selectedMailbackForm.data.dateSentToREQ.endDate) {
              this.selectedMailbackForm.data.dateSentToREQ = this.selectedMailbackForm.data.dateSentToREQ.endDate.valueOf();
            } else {
              this.selectedMailbackForm.data.dateSentToREQ = null;
            }



            this.ngxService.start();
            this.dashboardService.setMailbackDoc(id, this.selectedMailbackForm.data).then((resp: any) => {
              console.log(this.tableData);
              this.tableData[index].data = this.selectedMailbackForm.data;
              this.ngxService.stop();
            }, (err) => {
              console.log(err);
              this.ngxService.stop();
            });
          }
        }, (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        });
        this.ngxService.stop();
      }, (err) => {
        this.ngxService.stop();
      });
  }
  onDeleteMailback(id, index, mailbackEntry): any {
    this.ngxService.start();
    this.dashboardService.deleteMailbackDoc(id).then(() => {
      this.ngxService.stop();
      this.tableData.splice(index, 1);
      this.toastr.success('Entry deleted successfully!', 'Success', {
        timeOut: 3000,
      });
    }, (err) => {
      this.ngxService.stop();
      console.log(err);
    });
  }
  prevPage(): void {
    this.ngxService.start();
    this.disable_prev = true;
    const query = this.onRef();
    this.firestore.collection('mailbackForm', ref => {
        return query
          .startAt(this.get_prev_startAt())
          .endBefore(this.firstInResponse);
      }
    ).get()
      .subscribe(response => {
        this.firstInResponse = response.docs[0];
        this.lastInResponse = response.docs[response.docs.length - 1];
        this.tableData = [];
        for (const item of response.docs) {
          // tslint:disable-next-line
          item['did'] = item.id;
          this.tableData.push({
            id: item.id,
            data: item.data()
          });
        }

        // Maintaing page no.
        this.pagination_clicked_count--;

        // Pop not required value in array
        this.pop_prev_startAt(this.firstInResponse);

        // Enable buttons again
        this.disable_prev = false;
        this.disable_next = false;
        this.ngxService.stop();
      }, error => {
        this.disable_prev = false;
        this.ngxService.stop();
      });
  }

  nextPage(): void {
    this.ngxService.start();
    this.disable_next = true;
    const query = this.onRef();
    this.firestore.collection('mailbackForm', ref => {
        return query
          .startAfter(this.lastInResponse);
      }
    ).get()
      .subscribe(response => {
        if (!response.docs.length) {
          this.disable_next = true;
          this.ngxService.stop();
          return;
        }
        this.firstInResponse = response.docs[0];
        this.lastInResponse = response.docs[response.docs.length - 1];
        this.tableData = [];
        for (const item of response.docs) {
          this.tableData.push({
            id: item.id,
            data: item.data()
          });
        }
        this.pagination_clicked_count++;
        this.push_prev_startAt(this.firstInResponse);
        this.disable_next = false;
        if (response.docs.length < this.limit) {
          this.disable_next = true;
        }
        this.ngxService.stop();
      }, error => {
        this.disable_next = false;
        console.log(error);
        this.ngxService.stop();
      });
  }

  // tslint:disable-next-line:typedef variable-name
  push_prev_startAt(prev_first_doc) {
    this.prev_strt_at.push(prev_first_doc);
  }
  // tslint:disable-next-line:variable-name
  pop_prev_startAt(prev_first_doc): void {
    this.prev_strt_at.forEach(element => {
      // tslint:disable-next-line:triple-equals
      if (prev_first_doc.data().id == element.data().id) {
        element = null;
      }
    });
  }

  // Return the Doc rem where previous page will startAt
  // tslint:disable-next-line:typedef
  get_prev_startAt() {
    if (this.prev_strt_at.length > (this.pagination_clicked_count + 1)) {
      this.prev_strt_at.splice(this.prev_strt_at.length - 2, this.prev_strt_at.length - 1);
    }
    return this.prev_strt_at[this.pagination_clicked_count - 1];
  }

  // Date formate
  // tslint:disable-next-line:typedef
  readableDate(time) {
    const d = new Date(time);
    return d.getDate() + '/' + d.getMonth() + '/' + d.getFullYear();
  }

  // tslint:disable-next-line:typedef
  choosedDate(e) {
  }

  defaultQuery(): any {
    let currentRole = this.fbService.currentRole();
    if (currentRole === 'admin') {
      // no need to filter for admin, remove access filter from the query
      return this.firestore.collection('mailbackForm', ref => {
          return ref.limit(this.limit).orderBy('createdAt', 'desc');
        }
      );
    } else {
      // filter for access
      return this.firestore.collection('mailbackForm', ref => {
          return ref.limit(this.limit).where("access", "==", currentRole).orderBy('createdAt', 'desc');
        }
      );
    }
  }

  ngOnInit(): void {
    this.query = this.defaultQuery();
    this.onInit();
    // this.onCreateDummy();
    // this.onCreateDummy();
    // this.onCreateDummy();
    // this.onCreateDummy();
    // this.onCreateDummy();
    // this.onCreateDummy();
    // this.onCreateDummy();
    // this.onCreateDummy();
    // this.onCreateDummy();
    // this.onCreateDummy();
    // this.onCreateDummy();
    // this.onCreateDummy();
    // this.onCreateDummy();
    // this.onCreateDummy();
    // this.onCreateDummy();
  }
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
  onDateSortUp(): void {
    this.tableData.sort((a, b) => {
      console.log(a);
      // @ts-ignore
      return new Date(a.data.createdAt) - new Date(b.data.createdAt);
    });
  }
  onDateSortDown(): void {
    this.tableData.sort((a, b) => {
      console.log(a);
      // @ts-ignore
      return new Date(b.data.createdAt) - new Date(a.data.createdAt);
    });
  }
  onStatusSortUp(): void {
    this.tableData.sort((a, b) => b.data.status > a.data.status ? 1 : -1 );
  }
  onStatusSortDown(): void {
    this.tableData.sort((a, b) => b.data.status < a.data.status ? 1 : -1 );
  }
}
