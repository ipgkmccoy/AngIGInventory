import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { RollNumberSelectDialogComponent } from 'src/app/core/roll-number-select-dialog/roll-number-select-dialog.component';
import { ColorModel } from 'src/app/shared/model/colorModel';
import { crossplyDetailInsertModel, crossplyInsertModel } from 'src/app/shared/model/crossply.model';
import { LocationModel } from 'src/app/shared/model/locationModel';
import { RollNumberFetchedModel, RollNumberFetchedList, RollNumberFormValuesModel } from 'src/app/shared/model/rollNumber.model';
import { UserModel } from 'src/app/shared/model/userModel';
import { WidthModel } from 'src/app/shared/model/widthModel';
import { CrossplyService } from 'src/app/shared/service/crossplyService';
import { ExtruderService } from 'src/app/shared/service/extruderService';
import { InventoryCommonService } from 'src/app/shared/service/inventoryCommonService';

@Component({
  selector: 'app-crossply-newcrossplyadd',
  templateUrl: './newcrossplyadd.component.html',
  styleUrl: './newcrossplyadd.component.scss'
})
export class NewcrossplyaddComponent implements OnInit, OnDestroy {
  formHasErrors = false;
  errorList: string[] = [
    "Extruder Detail 0: roll width should be greater than or equal to crossply width",
    "Extruder Detail 1: roll width should be greater than or equal to crossply width",
    "Extruder 0: roll width should be greater than or equal to crossply width",
    "Extruder 0: roll width should be greater than or equal to crossply width",
    "Extruder 0: roll width should be greater than or equal to crossply width",
    "Extruder 0: roll width should be greater than or equal to crossply width",
  ];
  locationSubscription: Subscription | undefined;
  colorSubscription: Subscription | undefined;
  widthSubscription: Subscription | undefined;
  userSubscription: Subscription | undefined;
  extruderColorSubscription: Subscription | undefined;
  getExtruderRollNumberSubscription: Subscription | undefined;

  rollNumberColorZeroFetchedList = RollNumberFetchedList;


  crossplyLocationList: LocationModel[] = [];
  crossplyColorList: ColorModel[] = [];
  widthList: WidthModel[] = [];
  userList: UserModel[] = [];
  extruderColorList: ColorModel[] = [];

  public addCrossplyFormGroup = this.fb.group({
    locationId: new FormControl('', [Validators.required]),
    colorId: new FormControl('', [Validators.required]),
    widthId: new FormControl('', [Validators.required]),
    rollNumber: new FormControl('', [Validators.maxLength(10)]),
    length: new FormControl('', [Validators.required, Validators.maxLength(10)]),
    weight: new FormControl('', [Validators.required, Validators.maxLength(10)]),
    userId: new FormControl('', [Validators.required]),
    comment: new FormControl('', [Validators.maxLength(500)]),
    crossplyDetailList: new FormArray([this.createExtruderFormGroup()])
  });

  constructor(private fb: FormBuilder,
    private crossplyService: CrossplyService,
    private inventoryCommonService: InventoryCommonService,
    private extruderService: ExtruderService,
    public dialog: MatDialog) { }

  ngOnInit(): void {
    this.loadDropdowns();
    this.formValueChangeListeners();
  }

  formValueChangeListeners(){
    this.addCrossplyFormGroup.controls['colorId'].valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(data => {
      this.resetValues();
    });
    this.addCrossplyFormGroup.controls['widthId'].valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(data => {
      this.resetValues();
    });

   

  }

  resetValues(){
    for(let i =0; i<this.crossplyDetailList.length; i++){
      this.addCrossplyFormGroup.get(['crossplyDetailList', i])?.patchValue({
        colorZeroExtruderId:null,
        colorNinetyExtruderId:null
      });    
    }
  }
  get crossplyDetailList(): FormArray {
    return this.addCrossplyFormGroup.controls['crossplyDetailList'] as FormArray;
  }

  createExtruderFormGroup() {
    const addExtruderDetailGroup = this.fb.group({
      colorZeroColorId: new FormControl('', [Validators.required]),
      colorZeroWidthId: new FormControl('', [Validators.required]),
      colorZeroLength: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      colorZeroWeight: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      colorZeroExtruderId: new FormControl('', [Validators.required]),
      colorNinetyColorId: new FormControl('', [Validators.required]),
      colorNinetyWidthId: new FormControl('', [Validators.required]),
      colorNinetyLength: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      colorNinetyWeight: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      colorNinetyExtruderId: new FormControl('', [Validators.required])
    });
    return addExtruderDetailGroup;
  }

  onSubmit() {
    var item:any= this.addCrossplyFormGroup.getRawValue();
    var insertModel:crossplyInsertModel = {
      locationId: +item.locationId,
      colorId: +item.colorId,
      widthId: +item.widthId,
      rollNumber: item.rollNumber,
      length: +item.length,
      weight: +item.weight,
      userId: +item.userId,
      comment: item.comment,
      crossplyDetailList: this.mapTocrossplyDetailInsertModel(item.crossplyDetailList)
    }
    this.crossplyService.insertCrossply(insertModel).subscribe(data =>{
      console.log('Data successfully added', data);
    });
    //console.log('value of form values : ', rt);
    // var item:crossplyInsertModel = {
    //   locationId: +this.addCrossplyFormGroup.controls['locationId'].value,
    // colorId: +this.addCrossplyFormGroup.controls['colorId'].value ?? 0,
    // widthId: +this.addCrossplyFormGroup.controls['widthId'].value ?? 0,
    // rollNumber: this.addCrossplyFormGroup.controls['rollNumber'].value ?? '',
    // length: +this.addCrossplyFormGroup.controls['length'].value ?? 0,
    // weight: +this.addCrossplyFormGroup.controls['weight'].value ?? 0,
    // userId: +this.addCrossplyFormGroup.controls['userId'].value ?? 0,
    // comment: this.addCrossplyFormGroup.controls['comment'].value ?? '',
    // crossplyDetailList: this.mapExtruderDetailTocrossplyDetailInsertModel()
    // };
    //console.log('detail', item);
    this.validateForm();
    //this.mapTocrossplyDetailInsertModel();
  }



  addExtruder() {
    if (this.crossplyDetailList.length < 3) {
      this.crossplyDetailList.push(this.createExtruderFormGroup())
    }
  }

  removeExtruder() {
    if (this.crossplyDetailList.length > 1) {
      this.crossplyDetailList.removeAt(this.crossplyDetailList.length-1);
    }
  }

  setRollNumberFetched(controlName: string) {
    for (let item of this.rollNumberColorZeroFetchedList) {
      if (item.controlName == controlName) {
        item.dataFetched = true;
        break;
      }
    }
    //console.log(this.rollNumberColorZeroFetchedList);
  }

  fetchRollNumberColorZero(index: number) {
    let formValues:RollNumberFormValuesModel = this.getFormValues('colorZero', index);
    this.setRollNumber(formValues, 'colorZero');
  }

  fetchRollNumberColorNinety(index: number) {
    let formValues:RollNumberFormValuesModel = this.getFormValues('colorNinety', index);
    this.setRollNumber(formValues, 'colorNinety');
  }

  setRollNumber(formValues: RollNumberFormValuesModel, controlName: string){
    this.getExtruderRollNumberSubscription = this.crossplyService.getExtruderRollNumber(
       formValues.colorId, formValues.widthId
    ).subscribe(data => {
      const hasData: boolean = data.length > 0? true: false;       
      const dialogRef = this.dialog.open(RollNumberSelectDialogComponent, 
        {
          data: {
            colorId: formValues.colorId,
            widthId: formValues.widthId,
            hasData: hasData,
            colorname: formValues.colorName,
            widthname: formValues.widthValue.toString()
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result.data !=null){
            if (controlName == 'colorZero'){
              controlName = 'colorZero' + formValues.indexFetched.toString();             
              this.addCrossplyFormGroup.get(['crossplyDetailList', formValues.indexFetched])?.patchValue({
                colorZeroExtruderId: result.data.id
              });
            } else {
              controlName = 'colorNinety' + formValues.indexFetched.toString();
              this.addCrossplyFormGroup.get(['crossplyDetailList', formValues.indexFetched])?.patchValue({
                colorNinetyExtruderId:result.data.id
              });
            }
            var foundIndex = this.rollNumberColorZeroFetchedList.findIndex(x =>x.controlName == controlName);
            const item:RollNumberFetchedModel = {controlName: controlName, dataFetched: true };              
            this.rollNumberColorZeroFetchedList[foundIndex] = item;            
          }
        })
    });
  }

  getFormValues(colorType: string, index:number): RollNumberFormValuesModel{
    let colorId, widthId, widthValue = 0;
    let colorName: string = '';
    var formValues = this.addCrossplyFormGroup.get(['crossplyDetailList', index])?.value;
    switch(colorType){
      case 'colorZero':
        colorId = formValues?.colorZeroColorId;
        colorName = this.getExtruderColorName(colorId);
        widthId = formValues?.colorZeroWidthId;
        widthValue = this.getWidthNameById(widthId);
        break;
      case 'colorNinety':
        colorId = formValues?.colorNinetyColorId;
        colorName = this.getExtruderColorName(colorId);
        widthId = formValues?.colorNinetyWidthId;
        widthValue = this.getWidthNameById(widthId);
        break;
    }
    var returnType:RollNumberFormValuesModel ={
      colorId: colorId, widthId: widthId, colorName: colorName, widthValue: widthValue, indexFetched: index
    };
    return returnType;
  }

  validateForm() {
    //After the data is fetched do not change crossply location/color/width 
    // because that determined the roll numbers

    //Extruder zero width should be greater than or equal to width of crossply.

    // same level colorzero and colorninety cannot select same roll number

    // Sum of length of extruder should not exceed the length of crossply by 100

  }

  mapTocrossplyDetailInsertModel(crossplyDetailList:any[]){
    var detailList:crossplyDetailInsertModel[] = [];
    
    var createdBy = this.addCrossplyFormGroup.controls['userId'].value;
    crossplyDetailList.forEach(x => {
      var detail:crossplyDetailInsertModel = {
        ...x, crossplyId: 0, createdBy: createdBy
      }
      detailList.push(detail);
      console.log('detail : ', detail, 'detail list : ', detailList);
    });    
    return detailList;
  }
  

  loadDropdowns() {
    this.locationSubscription = this.crossplyService.getCrossplyLocations().subscribe(response => {
      this.crossplyLocationList = response;
    });

    this.colorSubscription = this.crossplyService.getCrossplyColors().subscribe(response => {
      this.crossplyColorList = response;
    });

    this.widthSubscription = this.inventoryCommonService.getWidths().subscribe(response => {
      this.widthList = response;
    });

    this.userSubscription = this.inventoryCommonService.getAllUsers().subscribe(response => {
      this.userList = response;
    });

    this.extruderColorSubscription = this.extruderService.getExtruderColors().subscribe(response => {
      this.extruderColorList = response;
    });
  }

  clearForm() {
    this.addCrossplyFormGroup.reset();
    this.addCrossplyFormGroup.markAsPristine();
  }

  getExtruderColorName(colorId: number) {
    return this.extruderColorList.find(x => x.id == colorId)?.name ?? "";
  }

  getWidthNameById(widthId: number) {
    let widthName = this.widthList.find(x => x.id == widthId)?.name;
    if (widthName){
      return +widthName;
    }
    return 0;
  }
  ngOnDestroy(): void {
    //('The subscription is destroyed');
    this.locationSubscription?.unsubscribe();
    this.colorSubscription?.unsubscribe();
    this.widthSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.extruderColorSubscription?.unsubscribe();
    this.getExtruderRollNumberSubscription?.unsubscribe();
  }

}
