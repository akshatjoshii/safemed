import {Component, Inject, OnInit} from '@angular/core';
import {AngularFirestore} from "@angular/fire/firestore";
import {AngularFireAuth} from "@angular/fire/auth";
import {DashboardService} from "../../services/dashboard.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Router} from "@angular/router";
import {DOCUMENT} from "@angular/common";
import {ToastrService} from "ngx-toastr";
import {FirebaseServiceService} from "../../services/firebase-service.service";
import {NgxUiLoaderService} from "ngx-ui-loader";

@Component({
  selector: 'app-bulk-update',
  templateUrl: './bulk-update.component.html',
  styleUrls: ['./bulk-update.component.scss']
})
export class BulkUpdateComponent implements OnInit {
  currentRole: any;
  selectedDateRange: any;
  query;
  searchStatus = "";
  selectedField = "";
  updatedBulkStatus = "";
  updatedBulkUSPSTracking;
  updatedBulkContainerId;
  selectedBulkSentDate;
  selectedBulkRecdDate;

  statuses = [
    { value: 'Not Started', label: 'Not Started' },
    { value: 'Pending Processing', label: 'Pending Processing' },
    { value: 'EnvSentToReq', label: 'EnvSentToReq' },
    { value: 'EnvRcvdAt123', label: 'EnvRcvdAt123' },
    { value: 'Destructed', label: 'Destructed' },
    { value: 'Override', label: 'Override' },
    { value: 'Not Response', label: 'No Response'}
  ];
  fields = [
    { value: 'Status', label: 'Status' },
    { value: 'Container ID', label: 'Container ID' },
    { value: 'USPS Tracking', label: 'USPS Tracking' },
    { value: 'Date Sent', label: 'Date Sent' },
    { value: 'Date Recd', label: 'Date Recd' },
  ]

  limit = 20;
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
              private ngxService: NgxUiLoaderService) { }
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
    const query = this.dashboardService.onRef('', this.selectedDateRange,
      this.searchStatus, '', this.limit);
    return query;
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
  }
  checkAll(ev) {
    this.tableData.forEach(mailbackForm => mailbackForm.isSelected = ev.target.checked)
  }
  isAllChecked() {
    return this.tableData.every(mailbackForm => mailbackForm.isSelected);
  }
  getSelectedTableItens() {
    return this.tableData.filter((item) => item.isSelected);
  }
  getSelectedIds() {
    return this.tableData.filter((item) => item.isSelected).map((item) => item.id);
  }
  reloadPage() {
    window.location.reload();
  }
  updateFields() {
    const ids = this.getSelectedIds();
    if (!ids || ids.length === 0) {
      return
    }
    this.ngxService.start();
    if (this.selectedField === 'Status') {
      if (this.updatedBulkStatus) {
        const promises = [];
        ids.forEach((id) => {
          promises.push(this.dashboardService.updateMailbackDoc(id, {
            status: this.updatedBulkStatus
          }));
        })
        Promise.all(promises).then((updated) => {
          console.log(updated);
          this.ngxService.stop();
          this.reloadPage();
        }, (err) => {
          this.ngxService.stop();
        })
      }
    } else if (this.selectedField === 'Container ID') {
      if (this.updatedBulkContainerId) {
        const promises = [];
        ids.forEach((id) => {
          promises.push(this.dashboardService.updateMailbackDoc(id, {
            containerId: this.updatedBulkContainerId
          }));
        })
        Promise.all(promises).then((updated) => {
          console.log(updated);
          this.ngxService.stop();
          this.reloadPage();
        }, (err) => {
          this.ngxService.stop();
        })
      }

    } else if (this.selectedField === 'USPS Tracking') {
      if (this.updatedBulkUSPSTracking) {
        const promises = [];
        ids.forEach((id) => {
          promises.push(this.dashboardService.updateMailbackDoc(id, {
            uspsTracking: this.updatedBulkUSPSTracking
          }));
        })
        Promise.all(promises).then((updated) => {
          console.log(updated);
          this.ngxService.stop();
          this.reloadPage();
        }, (err) => {
          this.ngxService.stop();
        })
      }
    } else if (this.selectedField === 'Date Sent') {
      if(this.selectedBulkSentDate && this.selectedBulkSentDate.endDate) {
        const promises = [];
        ids.forEach((id) => {
          promises.push(this.dashboardService.updateMailbackDoc(id, {
            dateSentToREQ: this.selectedBulkSentDate.endDate.valueOf()
          }));
        })
        Promise.all(promises).then((updated) => {
          console.log(updated);
          this.ngxService.stop();
          this.reloadPage();
        }, (err) => {
          this.ngxService.stop();
        })
      }

    } else if (this.selectedField === 'Date Recd') {
      if(this.selectedBulkRecdDate && this.selectedBulkRecdDate.endDate) {
        const promises = [];
        ids.forEach((id) => {
          promises.push(this.dashboardService.updateMailbackDoc(id, {
            dateRecDat123: this.selectedBulkRecdDate.endDate.valueOf()
          }));
        })
        Promise.all(promises).then((updated) => {
          console.log(updated);
          this.ngxService.stop();
          this.reloadPage();
        }, (err) => {
          this.ngxService.stop();
        })
      }
    }
  }
}
