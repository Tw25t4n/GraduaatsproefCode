import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  Signal,
  signal,
  TemplateRef,
  viewChild,
} from "@angular/core";

import { LanguageService } from "../../../../services/language.service";

import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule, NgForm } from "@angular/forms";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmIconImports } from "@spartan-ng/helm/icon";
import { provideIcons } from "@ng-icons/core";
import { lucideChevronUp, lucideEye, lucideEyeOff } from "@ng-icons/lucide";
import { BasicInputComponent } from "../../../../shared/components/ui/basic-input/basic-input.component";
import { BasicSelectComponent } from "../../../../shared/components/ui/basic-select/basic-select.component";
import { LocationService } from "../../../../services/location.service";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { combineLatest, switchMap } from "rxjs";
import { environment } from "../../../../../environments/environment";
import { TranslationKey } from "../../../../translations";
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner";
import { HttpClient, HttpErrorResponse, httpResource } from "@angular/common/http";
import { BasicCheckboxComponent } from "../../../../shared/components/ui/basic-checkbox/basic-checkbox.component";
import { NgIcon } from "@ng-icons/core";
import { HlmAccordionImports } from "@spartan-ng/helm/accordion";
import { PasswordFormComponent } from "../../password-reset/update/password-form/password-form.component";
import { Dialog, DialogModule } from "@angular/cdk/dialog";
import { HlmCardImports } from "@spartan-ng/helm/card";

@Component({
  templateUrl: "./create.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    HlmButtonImports,
    BasicInputComponent,
    BasicSelectComponent,
    HlmSpinnerImports,
    BasicCheckboxComponent,
    HlmAccordionImports,
    HlmIconImports,
    NgIcon,
    PasswordFormComponent,
    HlmCardImports,
    DialogModule,
  ],
  providers: [provideIcons({ lucideEye, lucideEyeOff, lucideChevronUp })],
})
export class BusinessRegistrationCreateComponent {
  private readonly domainClaimedTemplate = viewChild.required("domainClaimedTemplate", {
    read: TemplateRef,
  });

  private readonly language$ = inject(LanguageService).language$;
  private readonly language = inject(LanguageService).language;
  public readonly translate = inject(LanguageService).translator;
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly locationService = inject(LocationService);
  private readonly dialog = inject(Dialog);

  private readonly route = inject(ActivatedRoute);
  private readonly queryParamMap = toSignal(this.route.queryParamMap);
  private readonly token = computed(() => this.queryParamMap()?.get("token"));
  public readonly userExists = httpResource<boolean>(
  () => ({
    url: `${environment.apiUrl}/v1/auth/check-user-account`,
    headers: { authorization: `Bearer ${this.token()}` },
  }),
  {
    parse: (reply: { exists: boolean }) => reply.exists,
  },
  );
  public readonly companyDomain = httpResource<
  | { type: "public"; name: string }
  | { type: "private"; name: string; exists: boolean }
  >(() => ({
    url: `${environment.apiUrl}/v1/company-registration/check-email-domain`,
    headers: { authorization: `Bearer ${this.token()}` },
  }));

  // public readonly userPassword = signal<string | null>(null);

  public readonly companyName = signal<string>("");
  public readonly companyVat = signal<string>("");
  public readonly companyStreet = signal<string>("");
  public readonly companyCity = signal<string>("");
  public readonly companyZip = signal<string>("");
  public readonly countries = toSignal(
  this.language$.pipe(switchMap((l) => this.locationService.getCountries(l))),
    { initialValue: [] },
  );
  public readonly companyCountryCode = signal<string | undefined>(undefined);
  public readonly states: Signal<{ label: string; value: string }[]> = toSignal(
  combineLatest([this.language$, toObservable(this.companyCountryCode)]).pipe(
    switchMap(([l, countryCode]) =>
      countryCode ? this.locationService.getStates(countryCode, l) : [],
    ),
  ),
  { initialValue: [] },
  );
  public readonly companyStateCode = linkedSignal({
  source: this.companyCountryCode,
  computation: () => undefined,
  });

  public readonly companyClaimEmailDomain = linkedSignal({
  source: this.companyDomain.value,
  computation: () => false,
  });
  public readonly formCompleted = computed(
  () =>

    // (this.userExists.value() || this.userPassword()) &&

    this.companyName() &&
    this.companyVat() &&
    this.companyStreet() &&
    this.companyCity() &&
    this.companyZip() &&
    this.companyCountryCode() &&
    this.companyStateCode(),
  );
  public readonly openAccordeonElement = signal<"user" | "business">("user");

  inputState = signal<
  | { status: "disabled"; error?: undefined }
  | {
      status: "enabled";
      error?: { text: TranslationKey; params: { [key: string]: string } };
    }
  >({ status: "disabled" });

  constructor() {
    effect(() => {
      const err = this.companyDomain.error() || this.userExists.error();
      if (err) {
        let details: TranslationKey = "errors.unexpected";
        if (err instanceof HttpErrorResponse && err.status == 401) {
          details = "businessRegistration.registrationFailed.expiredToken";
        } else {
          console.error(err);
        }
        this.router.navigate(["/login/message"], {
          queryParams: {
            status: "error",
            title: "businessRegistration.registrationFailed.title",
            details,
          },
        });
        return;
      }
      const companyDomain = this.companyDomain.value();
      if (companyDomain === undefined) return;
      if (companyDomain.type == "private" && companyDomain.exists) {
        const dialogRef = this.dialog.open(this.domainClaimedTemplate(), {
          width: "70vw",
          maxWidth: "600px",
          disableClose: true,
          templateContext: {
            close: () => dialogRef.close(),
          },
        });
      }
      this.inputState.set({ status: "enabled" });
    });
  }

  notifyAdmins() {
    this.inputState.set({ status: "disabled" });
    this.http
      .post(
        `${environment.apiUrl}/v1/company-registration/notify-admin`,
        {},
        {
          headers: { authorization: `Bearer ${this.token()}` },
        },
      )
      .subscribe({
        next: () => {
          this.router.navigate(["/login/message"], {
            queryParams: {
              status: "wait",
              title: "businessRegistration.adminsNotified.title",
              details: "businessRegistration.adminsNotified.details",
            },
          });
        },
        error: (reason) => {
          let details: TranslationKey = "errors.unexpected";
          if (reason.status == 401) {
            details = "businessRegistration.registrationFailed.expiredToken";
          } else {
            console.error(reason);
          }
          this.router.navigate(["/login/message"], {
            queryParams: {
              status: "error",
              title: "businessRegistration.registrationFailed.title",
              details,
            },
          });
        },
      });
    }

  // submit() {
  submit(ngForm: NgForm) {

    this.inputState.set({ status: "disabled" });
    const reqBody: any = {
      user: {
        language: this.language(),
      },
      company: {
        name: this.companyName(),
        vat: this.companyVat(),
        language: this.language(),
        address: {
          street: this.companyStreet(),
          zip: this.companyZip(),
          city: this.companyCity(),
          state: this.companyStateCode(),
          country: this.companyCountryCode(),
        },
        claimEmailDomain: this.companyClaimEmailDomain(),
      },
    };
    if (!this.userExists.value()) {

      // reqBody.user.password = this.userPassword();
      reqBody.user.password = ngForm.value.passwordForm.newPassword.password;

    }
    this.http
      .post<{
        isActive: boolean;
        uuid: string;
      }>(`${environment.apiUrl}/v1/company-registration/create`, reqBody, {
        headers: { authorization: `Bearer ${this.token()}` },
      })
      .subscribe({
        next: ({ isActive }) => {
          if (isActive) {
            this.router.navigate(["/login/message"], {
              queryParams: {
                status: "success",
                title: "businessRegistration.registrationSuccessful.title",
              },
            });
          } else {
            this.router.navigate(["/login/message"], {
              queryParams: {
                status: "wait",
                title: "businessRegistration.registrationPending.title",
                details: "businessRegistration.registrationPending.details",
              },
            });
          }
        },
        error: (reason) => {
          if (reason.status == 400) {
            this.inputState.set({
              status: "enabled",
              error: {
                text: "businessRegistration.create.invalidInput",
                params: { message: reason.error.message },
              },
            });
            return;
          }
          let details: TranslationKey = "errors.unexpected";
          if (reason.status == 401) {
            details = "businessRegistration.registrationFailed.expiredToken";
          } else if (reason.status == 403) {
            details =
              "businessRegistration.registrationFailed.publicEmailDomainCannotBeClaimed";
          } else if (reason.status == 409) {
            details =
              "businessRegistration.registrationFailed.emailDomainAlreadyClaimed";
          } else {
            console.error(reason);
          }
          this.router.navigate(["/login/message"], {
            queryParams: {
              status: "error",
              title: "businessRegistration.registrationFailed.title",
              details,
            },
          });
        },
      });
  }

  changeOpenAccordeonElement() {
    this.openAccordeonElement.set(
      this.openAccordeonElement() == "user" ? "business" : "user",
    );
  }
}
