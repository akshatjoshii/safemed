import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {AngularFireAuth} from '@angular/fire/auth';
import {FirebaseServiceService} from "./firebase-service.service";

const MAILBACK = 'mailbackForm';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(public firestore: AngularFirestore, private auth: AngularFireAuth, public fbService: FirebaseServiceService) {
  }
  ADMIN = 'admin';
  onRef(email, selectedDate, selectedStatus, selectedState, limit): any {
    let currentRole = this.fbService.currentRole();
    let start;
    let end;
    if (email) {
      // in case of email, return the fn, no point of other filters
      if (currentRole === this.ADMIN) {
        // in case of admin, no point of sending access
        return this.firestore.collection(MAILBACK).ref
          .orderBy('createdAt', 'desc')
          .limit(limit).where('yourEmail', '==', email);
      } else {
        return this.firestore.collection(MAILBACK).ref
          .where("access", "==", currentRole)
          .orderBy('createdAt', 'desc')
          .limit(limit).where('yourEmail', '==', email);
      }
    }
    if (selectedDate && selectedDate.start) {
      start = selectedDate.start.valueOf();
      end = selectedDate.end.valueOf();
    }


    let query;

    if (currentRole === this.ADMIN) {
      query = this.firestore.collection(MAILBACK).ref
        .orderBy('createdAt', 'desc')
        .limit(limit);
    } else {
      query = this.firestore.collection(MAILBACK).ref
        .where("access", "==", currentRole)
        .orderBy('createdAt', 'desc')
        .limit(limit);
    }

    if (selectedStatus && !start && !end && !selectedState) {
      query = query.where('status', '==', selectedStatus);
    } else if (start && end && !selectedStatus && !selectedState) {
      query = query.where('createdAt', '>=', start).where('createdAt', '<=', end);
    } else if (start && end && selectedStatus && !selectedState) {
      query = query
        .where('status', '==', selectedStatus)
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end);
    } else if (selectedState && !selectedStatus && !start) {
      query = query
        .where('state', '==', selectedState);
    } else if (selectedState && selectedStatus && !start) {
      query = query
        .where('state', '==', selectedState)
        .where('status', '==', selectedStatus);
    } else if (selectedState && !selectedStatus && start) {
      query = query
        .where('state', '==', selectedState)
        .where('createdAt', '>=', start).where('createdAt', '<=', end);
    } else if (selectedState && selectedStatus && start) {
      query = query
        .where('status', '==', selectedStatus)
        .where('state', '==', selectedState)
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end);
    }
    return query;
  }
  onMonthsRef(months, selectedStatus): any {
    let currentRole = this.fbService.currentRole();

    let query;

    if (currentRole === this.ADMIN) {
      query = this.firestore.collection(MAILBACK).ref
        .orderBy('createdAt', 'desc');
    } else {
      query = this.firestore.collection(MAILBACK).ref
        .where("access", "==", currentRole)
        .orderBy('createdAt', 'desc');
    }

    // months.forEach((month) => {
    //   query = query.where('monthYear', '==', month.value);
    // });
    query = query.where('monthYear', '==', months.value);
    if (selectedStatus) {
      query = query
        .where('status', '==', selectedStatus);
    }
    return query;
  }
  onMailbackDocumentRead(id): any {
    return this.firestore.collection(MAILBACK).doc(id);
  }

  setMailbackDoc(id, item): any {
    return this.firestore.collection(MAILBACK).doc(id).set(item);
  }
  updateMailbackDoc(id, item) {
    return this.firestore.collection(MAILBACK).doc(id).update(item);
  }
  deleteMailbackDoc(id): any {
    return this.firestore.collection(MAILBACK).doc(id).delete();
  }
  convertToCSV(data, filename= `${new Date().toISOString()}`): any {
    const items = data;
    const replacer = (key, value) => value === null ? 'Null' : value;
    let header = Object.keys(items[0]);
    header = header.sort();
    let csv: any = [
      header.join(','), // header row first
      ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ]
    csv = [...new Set(csv)]
    csv = csv.join('\r\n');
    // Create link and download
    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURIComponent(csv));
    link.setAttribute('download', `${filename}+.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return csv;
  }

}
