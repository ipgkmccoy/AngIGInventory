import { AfterViewChecked, AfterViewInit, Component, Input, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { crossplyModel } from 'src/app/shared/model/crossply.model';
import { CrossplyService } from 'src/app/shared/service/crossplyService';
import { DownloadService } from 'src/app/shared/service/downloadService';

@Component({
  selector: 'app-display-crossply',
  templateUrl: './display-crossply.component.html',
  styleUrl: './display-crossply.component.scss'
})
export class DisplayCrossplyComponent implements AfterViewInit{
  headerColor = '#84A98C';
  colorList = ['#84A98C', '#3C4A3F', '#9EAFA2', '#6CABA8'];
  
  dataSourceData: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  displayedColumns = ['crossplyId', 'crossplyLocation', 
  'crossplyColor', 'crossplyWidth', 
 'crossplyLength', 'crossplyWeight',
 'crossplyRollNumber', 'crossplyFullName',
  'crossplyCreatedDate', 'crossplyComment'];

  @ViewChild('crossplyTblSort') crossplyTblSort = new MatSort();

  constructor(private crossplyService: CrossplyService, 
    private downloadService:DownloadService,
    private router:Router){}

  ngAfterViewInit():void {
    this.crossplyService.getCrossplyAllData().subscribe(data => {
      data.forEach(x => x.crossplyFullName = x.crossplyFirstName + " " + x.crossplyLastName);
      this.dataSourceData = new MatTableDataSource(data);
      this.setSortAccessors();
    });   
  }

  setSortAccessors(){
    this.crossplyTblSort.disableClear = true;
    this.dataSourceData.sort = this.crossplyTblSort;
    this.dataSourceData.sortingDataAccessor = (row:crossplyModel, columnName: string): any => {
      const columnValue = this.getColumnValue(columnName, row);
      return columnValue;
    }
  }

    getColumnValue(columnNamePassed: string, row:crossplyModel){
      let columnValue:any;
      switch(columnNamePassed){
        case 'crossplyId':
          columnValue = row.crossplyId;
          break;
        case 'crossplyLocation':
          columnValue = row.crossplyLocation;
          break;
        case 'crossplyColor':
          columnValue = row.crossplyColor;
          break;       
        case 'crossplyWidth':
          columnValue = row.crossplyWidth;
          break;
        case 'crossplyLength':
          columnValue = +row.crossplyLength;
          break;
        case 'crossplyWeight':
          columnValue = +row.crossplyWeight;
          break;
        case 'crossplyComment':
          columnValue = row.crossplyComment;
          break;
        case 'crossplyCreatedDate':
          columnValue = new Date(row.crossplyCreatedDate);
          break;
        case 'crossplyRollNumber':
          columnValue = row.crossplyRollNumber;
          break;
        case 'crossplyFullName':
          columnValue = row.crossplyFullName;
          break;
      }
      return columnValue;
    }

    downloadCrossplyFile(){
      this.crossplyService.getCrossplyAllData().subscribe(data => {
        data.forEach(x => x.crossplyFullName = x.crossplyFirstName + " " + x.crossplyLastName);
      const headersToParse: string[] = ['crossplyId', 'crossplyLocation', 'crossplyColor', 'crossplyWidth', 
       'crossplyLength', 'crossplyWeight', 'crossplyRollNumber', 'crossplyCreatedDate', 'crossplyFullName'];
        const headersToShow: string[] = ['Id', 'Location', 'Color', 'Width', 'Length', 'Weight', 'RollNumber',
         'Created Date', 'Created By'];      
        this.downloadService.downloadFile(data, 'crossplyData', headersToShow, headersToParse);
      });
    }
  
  

    takeMeToAdd(){
      console.log('in button click of add /crossply/add');
      this.router.navigateByUrl('/crossply/add');
    }
  
    changeColor(){
      const colorRandomIndex = this.baseRandom(0, this.colorList.length-1);
      this.headerColor = this.colorList[colorRandomIndex];
    }


  
    baseRandom(lower:number, upper:number) {
      return lower + Math.floor(Math.random() * (upper - lower + 1));
    }
  }
