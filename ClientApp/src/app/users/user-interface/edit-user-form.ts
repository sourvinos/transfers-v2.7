import { Location } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AccountService } from 'src/app/shared/services/account.service';
import { DialogService } from 'src/app/shared/services/dialog.service';
import { SnackbarService } from 'src/app/shared/services/snackbar.service';
import { Utils } from '../../shared/classes/utils';
import { KeyboardShortcuts, Unlisten } from '../../shared/services/keyboard-shortcuts.service';
import { User } from '../../account/classes/user';
import { UserService } from '../classes/user.service';

@Component({
    selector: 'edit-user-form',
    templateUrl: './edit-user-form.html',
    styleUrls: ['../../shared/styles/forms.css']
})

export class EditUserFormComponent implements OnInit, AfterViewInit, OnDestroy {

    // #region Variables

    id: string
    user: User
    url = '/users'
    hidePassword = true
    // flatForm: {}

    unlisten: Unlisten
    ngUnsubscribe = new Subject<void>();

    form = this.formBuilder.group({
        id: '',
        username: ['', [Validators.required, Validators.maxLength(100)]],
        displayName: ['', [Validators.required, Validators.maxLength(20)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]]
    })

    // #endregion

    constructor(private userService: UserService, private accountService: AccountService, private formBuilder: FormBuilder, private router: Router, private activatedRoute: ActivatedRoute, public dialog: MatDialog, private keyboardShortcutsService: KeyboardShortcuts, private dialogService: DialogService, private snackbarService: SnackbarService, private location: Location) {
        this.activatedRoute.params.subscribe(p => {
            this.id = p['id']
            if (this.id) {
                this.getRecord()
            }
        })
    }

    ngOnInit() {
        this.addShortcuts()
    }

    ngAfterViewInit() {
        this.focus('username')
    }

    ngOnDestroy() {
        this.ngUnsubscribe.next()
        this.ngUnsubscribe.unsubscribe()
        this.unlisten()
    }

    /**
     * Caller(s):
     *  Service - CanDeactivateGuard()
     *
     * Description:
     *  Desides which action to perform when a route change is requested
     */
    canDeactivate() {
        if (this.form.dirty) {
            this.dialogService.open('Warning', '#FE9F36', 'If you continue, changes in this record will be lost.', ['cancel', 'ok']).subscribe(response => {
                if (response) {
                    this.resetForm()
                    this.goBack()
                    return true
                }
            })
        } else {
            return true
        }
    }

    changePassword() {
        this.router.navigate([this.location.path() + '/changePassword'])
    }

    /**
     * Caller(s):
     *  Template - deleteRecord()
     *
     * Description:
     *  Deletes the current record
     */
    deleteRecord() {
        this.dialogService.open('Warning', '#FE9F36', 'If you continue, this record will be permanently deleted.', ['ok', 'cancel']).subscribe(response => {
            if (response) {
                this.userService.delete(this.form.value.id).subscribe(() => {
                    this.showSnackbar('Record deleted', 'info')
                    this.resetForm()
                    this.goBack()
                })
            }
        })
    }

    /**
     * Caller(s):
     *  Template - saveRecord()
     *
     * Description:
     *  Updates an existing record
     */
    saveRecord() {
        if (!this.form.valid) { return }
        this.userService.update(this.form.value.id, this.form.value).subscribe(() => {
            this.showSnackbar('Record updated', 'info')
            this.resetForm()
            this.goBack()
        })
    }

    /**
     * Caller(s):
     *  Class - ngOnInit()
     *
     * Description:
     *  Self-explanatory
     */
    private addShortcuts() {
        this.unlisten = this.keyboardShortcutsService.listen({
            'Escape': () => {
                if (document.getElementsByClassName('cdk-overlay-pane').length === 0) {
                    this.goBack()
                }
            },
            'Alt.D': (event: KeyboardEvent) => {
                event.preventDefault()
                this.deleteRecord()
            },
            'Alt.S': (event: KeyboardEvent) => {
                if (document.getElementsByClassName('cdk-overlay-pane').length === 0) {
                    event.preventDefault()
                    this.saveRecord()
                }
            },
            'Alt.C': (event: KeyboardEvent) => {
                event.preventDefault()
                if (document.getElementsByClassName('cdk-overlay-pane').length !== 0) {
                    document.getElementById('cancel').click()
                }
            },
            'Alt.O': (event: KeyboardEvent) => {
                event.preventDefault()
                if (document.getElementsByClassName('cdk-overlay-pane').length !== 0) {
                    document.getElementById('ok').click()
                }
            }
        }, {
            priority: 2,
            inputs: true
        })
    }

    /**
     * Caller(s):
     *  Class - ngAfterViewInit()
     * Description:
     *  Calls the public method()
     *
     * @param field
     */
    private focus(field: string) {
        Utils.setFocus(field)
    }

    /**
     * Caller(s):
     *  Class - constructor()
     *
     * Description:
     *  Gets the selected record from the api
     */
    private getRecord() {
        if (this.id) {
            this.userService.getSingle(this.id).then(result => {
                this.user = result
                this.populateFields()
            })
        }
    }

    /**
     * Caller(s):
     *  Class - canDeactive(), deleteRecord(), saveRecord()
     *
     * Description:
     *  On escape navigates to the list
     */
    private goBack() {
        this.router.navigate([this.url])
    }

    /**
     * Caller(s):
     *  Class - getRecord()
     *
     * Description:
     *  Populates the form with record values
     *
     * @param result
     */
    private populateFields() {
        this.form.setValue({
            id: this.user.id,
            username: this.user.username,
            displayName: this.user.displayName,
            email: this.user.email
        })
    }

    /**
     * Caller(s):
     *  Class - canDeactivate() - saveRecord()
     *
     * Description:
     *  Resets the form with default values
     */
    private resetForm() {
        this.form.reset({
            id: 0,
            username: '',
            displayName: '',
            email: ''
        })
    }

    /**
     * Caller(s):
     *  Class - saveRecord() - deleteRecord()
     */
    private showSnackbar(message: string, type: string): void {
        this.snackbarService.open(message, type)
    }

    // #region Helper properties

    get username() {
        return this.form.get('username')
    }

    get displayName() {
        return this.form.get('displayName')
    }

    get email() {
        return this.form.get('address')
    }

    // #endregion

}
