import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core'
import { FormBuilder, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { Subject } from 'rxjs'
import { Utils } from 'src/app/shared/classes/utils'
import { KeyboardShortcuts, Unlisten } from 'src/app/shared/services/keyboard-shortcuts.service'
import { AccountService } from '../../shared/services/account.service'
import { CountdownService } from '../../shared/services/countdown.service'

@Component({
    selector: 'login-form',
    templateUrl: './login-form.html',
    styleUrls: ['../../shared/styles/forms.css', './login-form.css']
})

export class LoginFormComponent implements OnInit, AfterViewInit, OnDestroy {

    // #region Init

    countdown = 0
    invalidLogin: boolean
    returnUrl: string
    hidePassword = true

    unlisten: Unlisten
    ngUnsubscribe = new Subject<void>()

    form = this.formBuilder.group({
        userName: ['sourvinos', Validators.required],
        password: ['12345', Validators.required]
    })

    // #endregion

    constructor(private accountService: AccountService, private countdownService: CountdownService, private router: Router, private formBuilder: FormBuilder, private keyboardShortcutsService: KeyboardShortcuts) { }

    ngOnInit() {
        this.addShortcuts()
    }

    ngAfterViewInit() {
        this.focus('userName')
    }

    ngOnDestroy(): void {
        this.ngUnsubscribe.next()
        this.ngUnsubscribe.unsubscribe()
        this.unlisten()
    }

    /**
     * Caller(s)
     *  Template - forgotPassword()
     */
    forgotPassword() {
        this.router.navigate(['/forgotPassword'])
    }

    login() {
        const userlogin = this.form.value
        this.accountService.login(userlogin.userName, userlogin.password).subscribe(() => {
            this.invalidLogin = false
            this.router.navigate(['/'])
            this.countdownService.reset()
            this.countdownService.countdown.subscribe(data => { this.countdown = data })
        })
    }

    private addShortcuts() {
        this.unlisten = this.keyboardShortcutsService.listen({
            'Alt.L': (event: KeyboardEvent): void => {
                event.preventDefault()
                this.login()
            }
        }, {
            priority: 2,
            inputs: true
        })
    }

    private focus(field: string) {
        Utils.setFocus(field)
    }

    // #region Helper properties

    get userName() {
        return this.form.get('userName')
    }

    get password() {
        return this.form.get('password')
    }

    // #endregion

}
