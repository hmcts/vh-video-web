import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { PageUrls } from 'src/app/shared/page-url.constants';

@Component({
  selector: 'app-equipment-check',
  templateUrl: './equipment-check.component.html',
  styleUrls: ['./equipment-check.component.css']
})
export class EquipmentCheckComponent implements OnInit {
  equipmentCheckForm: FormGroup;
  constructor(private router: Router, private fb: FormBuilder) {
    this.equipmentCheckForm = fb.group({
      nextButton: new FormControl()
    });
  }

  ngOnInit() {
  }

  onSubmit() {
    this.router.navigate([PageUrls.CameraAndMicrophone]);
  }
}
