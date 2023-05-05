import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {DashboardService} from '../../services/dashboard.service';
import {AngularFirestore} from '@angular/fire/firestore';
import {NgxUiLoaderService} from 'ngx-ui-loader';
import {ToastrService} from 'ngx-toastr';
const MAILBACK = 'mailbackForm';
import * as _ from 'lodash';
import {FirebaseServiceService} from '../../services/firebase-service.service';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-data',
  templateUrl: './data.component.html',
  styleUrls: ['./data.component.scss']
})
export class DataComponent implements OnInit {
  constructor(private dashboardService: DashboardService,
              private toastr: ToastrService,
              private ngxService: NgxUiLoaderService,
              public fbService: FirebaseServiceService,
              public firestore: AngularFirestore) {
  }
  deletePopover = {
    popoverTitle: 'Confirmation Required',
    popoverMessage: 'Are you sure you want to delete selected entries?',
    confirmClicked : false,
    cancelClicked : false,
  };
  @ViewChild('listItems', {static: false}) listItems: ElementRef;
  public monthsYears: any;
  tableData: any[];
  selectedStatus = '';
  statuses = [
    { value: 'Not Started', label: 'Not Started' },
    { value: 'Pending Processing', label: 'Pending Processing' },
    { value: 'EnvSentToReq', label: 'EnvSentToReq' },
    { value: 'EnvRcvdAt123', label: 'EnvRcvdAt123' },
    { value: 'Destructed', label: 'Destructed' },
    { value: 'Override', label: 'Override' }
  ];
  ngOnInit(): void {
   this.monthsYears = this.initMonthsYear();
  }
  initMonthsYear(): Array<object> {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date();
    const monthsYearArr: Array<object> = [];
    d.setDate(1);
    for (let i = 0; i <= 11; i++) {
      monthsYearArr.push({
        label: monthNames[d.getMonth()] + ' ' + d.getFullYear(),
        value: d.getMonth() + 1 + '-' + d.getFullYear(),
        checked: false
      });
      d.setMonth(d.getMonth() - 1);
    }
    return monthsYearArr;
  }
  onViewData(): void {
    this.tableData = [];
    const selectedMonthsYears = this.monthsYears.filter(monthYear => monthYear.checked === true);
    this.ngxService.start();
    if (selectedMonthsYears.length < 1) {
      this.toastr.error('Please select at least 1 month!', 'Error', {
        timeOut: 3000,
      });
      this.ngxService.stop();
      return;
    }
    selectedMonthsYears.forEach((monthYear, i) => {
      const query = this.dashboardService.onMonthsRef(monthYear, this.selectedStatus);
      this.firestore.collection(MAILBACK, ref => query).snapshotChanges().subscribe(response => {
        if (!response.length) {
          console.log('No Data Available');
          if (i === selectedMonthsYears.length - 1) {
            this.ngxService.stop();
          }
          return false;
        }
        for (const item of response) {
          // tslint:disable-next-line
          this.tableData.push({
            id: item.payload.doc.id,
            data: item.payload.doc.data()
          });
        }
        if (i === selectedMonthsYears.length - 1) {
          this.ngxService.stop();
        }
        const id = 'id';
        this.tableData = [...new Map(this.tableData.map(item => [item[id], item])).values()] // removing duplicates
      }, error => {
        console.log(error);
        if (i === selectedMonthsYears.length - 1) {
          this.ngxService.stop();
        }
      });
    });
  }
  onEntry(entry): void {
    if (entry.fired) {
      return; // do not execute if function is already excuted for an entry
    }
    entry.fired = true;
    entry.checked = true;
  }
  onDeleteEntries(): any {
    if (!this.tableData) { return false; }
    const batchArray = [];
    batchArray.push(this.firestore.firestore.batch());
    let operationCounter = 0;
    let batchIndex = 0;
    this.ngxService.start();
    if (this.listItems && this.listItems.nativeElement) {
      const len = this.getCheckedCheckboxLength(this.listItems.nativeElement.querySelectorAll('[type=\'checkbox\']'));
      if (len < 1) {
        this.ngxService.stop();
        this.toastr.success('No Entry Selected', 'Success', {
          timeOut: 3000,
        });
        return;
      }
    }
    const tableLen = this.tableData.length;
    this.tableData.forEach((entry, index) => {
      if (entry.checked) {
        batchArray[batchIndex].delete(this.firestore.collection(MAILBACK).doc(entry.id).ref);
        operationCounter++;
        if (operationCounter === 499) {
          batchArray.push(this.firestore.firestore.batch());
          batchIndex++;
          operationCounter = 0;
        }
      }
    });
    batchArray.reduce(async (acc, nextBatch) => {
      await acc;
      const result = await nextBatch.commit();
    }, Promise.resolve()).then(() => {
      this.onViewData();
      this.toastr.success('Selected entries deleted successfully!', 'Success', {
        timeOut: 3000,
      });
    }, () => {
      this.ngxService.stop();
    });
  }
  onExportCsv(): void {
    const csvData = this.tableData.filter(entry => entry.checked).map(entry => {
      if (entry.data.createdAt) {
        entry.data.createdAt = new Date(entry.data.createdAt).toISOString().slice(0, 10);
        let datePipe = new DatePipe("en-US");
        entry.data.createdAt = datePipe.transform(entry.data.createdAt, 'MM/dd/yyyy');
      }
      if (entry.data) {
        for (const key in entry.data) {
          if (entry.data.hasOwnProperty(key)) {
            if (!entry.data[key] || entry.data[key] === null ) {
              entry.data[key] = 'null'
            }
          }
        }
      }
      return entry.data
    });
    console.log(csvData);
    this.dashboardService.convertToCSV(csvData);
  }
  // tslint:disable-next-line:typedef
  // async onDel(entriesArr) {
  //   const documentSnapshotArray = entriesArr;
  //
  //   const batchArray = [];
  //   batchArray.push(this.firestore.firestore.batch());
  //   let operationCounter = 0;
  //   let batchIndex = 0;
  //
  //   documentSnapshotArray.forEach(documentSnapshot => {
  //     // update document data here...
  //
  //     batchArray[batchIndex].delete(this.firestore.collection(MAILBACK).doc(documentSnapshot.id).ref);
  //     operationCounter++;
  //
  //     if (operationCounter === 499) {
  //       batchArray.push(this.firestore.firestore.batch());
  //       batchIndex++;
  //       operationCounter = 0;
  //     }
  //   });
  //
  //   // batchArray.forEach(async batch => await batch.commit());
  //   batchArray.reduce(async (acc, nextBatch) => {
  //     await acc;
  //     const result = await nextBatch.commit();
  //     console.log(result);
  //   }, Promise.resolve());
  //
  //   return;
  // }
  getCheckedCheckboxLength(els): number {
    const len = [].slice.call(els)
      // tslint:disable-next-line:only-arrow-functions typedef
      .filter(function(e) { return e.checked; }).length;
    return len;
  }
}
