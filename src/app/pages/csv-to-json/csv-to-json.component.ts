import { Component, OnInit } from '@angular/core';
declare var csvjson: any;
@Component({
  selector: 'app-csv-to-json',
  templateUrl: './csv-to-json.component.html',
  styleUrls: ['./csv-to-json.component.scss']
})
export class CsvToJsonComponent implements OnInit {
  fileName: any;
  jsonData: any;
  nyJsonData: any;
  nyFileName: any;
  constructor() { }

  ngOnInit(): void {
  }
  onFileChange(e): void {
    const reader = new FileReader();
    reader.readAsText(e.target.files[0]);
    reader.onload = (evt) => {
      const fileName = e.target.files[0].name.split('.')[0];
      this.fileName = fileName;
      const jsonData = this.onJsonTranslation(this.csvJSON(evt.target.result).rows);
      console.log(jsonData);
      this.jsonData = jsonData;
      // this.saveJSON(jsonData, fileName + '.json');
    };
  }
  onNyFileChange(e): void {
    const reader = new FileReader();
    reader.readAsText(e.target.files[0]);
    reader.onload = (evt) => {
      const fileName = e.target.files[0].name.split('.')[0];
      this.nyFileName = fileName;
      const jsonData = this.onJsonTranslation(this.csvJSON(evt.target.result).rows, 'newYork');
      this.nyJsonData = jsonData;
      // this.saveJSON(jsonData, fileName + '.json');
    };
  }
  onDownloadJSON(): void {
    this.saveJSON(this.jsonData, this.fileName + '.json');
  }
  onNyDownloadJSON(): void {
    this.saveJSON(this.nyJsonData, this.nyFileName + '.json');
  }
  csvJSON(csv): any {
    return csvjson.csv2json(csv);
    // const lines = csv.split('\r');
    // const result = [];
    // const headers = lines[0].split(',');
    // for (let i = 1; i < lines.length; i++){
    //   const obj = {};
    //   const currentline = lines[i].split(',');
    //   for (let j = 0; j < headers.length; j++){
    //     obj[headers[j]] = currentline[j];
    //   }
    //   result.push(obj);
    // }
    // return JSON.stringify(result);
  }
  // @ts-ignore
  onJsonTranslation(arrOfObjs, type = ''): any {
    const locations = arrOfObjs.map((obj) => {
      if (!obj.AltHourNote) {
        obj.AltHourNote = null;
      }
      obj.Type = obj.Type ? obj.Type.replace(/(\r\n|\n|\r)/gm, '') : '';
      if (obj.Type === 'Medicine Kiosk') {
          obj.Type = 'Drop-Off Location';
      } else if (obj.Type === 'Mail-back Supplies' || obj.Type ===  'Mailback Supplies') {
        obj.Type = 'Mail-Back Supply Location (standard envelopes only)';
      }
      const jsonObj = {
        Company: obj['Account Name'],
        Street: obj['Mailing Address Line 1'],
        City: obj['Mailing City'],
        State: obj['Mailing State/Province'],
        Zip: obj['Mailing Zip/Postal Code'],
        Phone: obj['Phone Number'] || '',
        AltHourNote:  obj.AltHourNote,
        Longitude: obj.Longitude + '',
        Latitude: obj.Latitude + '',
        SundayOpen: obj.SundayOpen,
        SundayClose: obj.SundayClose,
        MondayOpen: obj.MondayOpen,
        MondayClose: obj.MondayClose,
        TuesdayOpen: obj.TuesdayOpen,
        TuesdayClose: obj.TuesdayClose,
        WednesdayOpen: obj.WednesdayOpen,
        WednesdayClose: obj.WednesdayClose,
        ThursdayOpen: obj.ThursdayOpen,
        ThursdayClose: obj.ThursdayClose,
        FridayOpen: obj.FridayOpen,
        FridayClose: obj.FridayClose,
        SaturdayOpen: obj.SaturdayOpen,
        SaturdayClose: obj.SaturdayClose,
        Services: obj.Type ? [obj.Type.replace(/(\r\n|\n|\r)/gm, '')] : ''
      };
      if (!type) {
        return {
          ...jsonObj
        }
      } else if (type === 'newYork') {
        return {...jsonObj, HasRestrictedAccess: obj['Restricted Access']}
      }
    });
    return {
        CompanyName: 'Inmar Intelligence',
        CompanyID: '007cfcf0-5efe-4540-9d90-fbb39d55c311',
        Locations: locations
      };
  }
  saveJSON(data, filename): void {

    if (!data) {
      console.error('No data');
      return;
    }

    if (!filename) { filename = 'console.json'; }

    if (typeof data === 'object'){
      data = JSON.stringify(data, undefined, 4);
    }

    // tslint:disable-next-line:one-variable-per-declaration
    const blob = new Blob([data], {type: 'text/json'}),
      e    = document.createEvent('MouseEvents'),
      a    = document.createElement('a');

    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':');
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    a.dispatchEvent(e);
  }
}
