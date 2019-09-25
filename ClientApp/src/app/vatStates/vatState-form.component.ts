import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { CanComponentDeactivate } from './../services/auth-guard.service';
import { HelperService } from '../services/helper.service';
import { Utils } from '../shared/classes/utils';
import { VatStateService } from '../services/vatState.service';

@Component({
    selector: 'app-vatState-form',
    templateUrl: './vatState-form.component.html',
    styleUrls: ['../shared/styles/forms.css']
})

export class VatStateFormComponent implements OnInit, CanComponentDeactivate {

    id: number = null;

    form = this.formBuilder.group({
        id: 0,
        description: ['', [Validators.required, Validators.maxLength(100)]]
    })

    constructor(private vatStateService: VatStateService, private helperService: HelperService, private formBuilder: FormBuilder, private router: Router, private route: ActivatedRoute) {
        route.params.subscribe(p => (this.id = p['id']))
    };

    ngOnInit() {
        if (this.id) {
            this.vatStateService.getVatState(this.id).subscribe(result => {
                this.populateFields()
            }, error => {
                if (error.status == 404) {
                    this.router.navigate(['/error'])
                }
            });
        }
    }

    populateFields() {
        this.vatStateService.getVatState(this.id).subscribe(
            result => {
                this.form.setValue({
                    id: result.id,
                    description: result.description
                })
            },
            error => {
                Utils.ErrorLogger(error);
            });;
    }

    get description() {
        return this.form.get('description');
    }

    getRequiredFieldMessage() {
        return 'This field is required, silly!';
    }

    getMaxLengthFieldMessage() {
        return 'This field must not be longer than '
    }

    save() {
        if (!this.form.valid) return
        this.form.value.userName = this.helperService.getUsernameFromLocalStorage()
        if (this.id == null) {
            this.vatStateService.addVatState(this.form.value).subscribe(data => this.router.navigate(['/vatStates']), error => Utils.ErrorLogger(error));
        }
        else {
            this.vatStateService.updateVatState(this.id, this.form.value).subscribe(data => this.router.navigate(['/vatStates']), error => Utils.ErrorLogger(error));
        }
    }

    delete() {
        if (this.id !== null) {
            if (confirm('This record will permanently be deleted. Are you sure?')) {
                this.vatStateService.deleteVatState(this.id).subscribe(data => this.router.navigate(['/vatStates']), error => Utils.ErrorLogger(error));
            }
        }
    }

    confirm() {
        return confirm('Are you sure?')
    }

}
