import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";

import { environment } from "../../../../../environments/environment";
import { LanguageService } from "../../../../services/language.service";
import { CommonModule } from "@angular/common";
import { WhitelabelingService } from "../../../../services/whitelabeling.service";
import { FormsModule, NgForm } from "@angular/forms";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner";
import { TranslationKey } from "../../../../translations";
import { toSignal } from "@angular/core/rxjs-interop";
import { PasswordFormComponent } from "./password-form/password-form.component";

const DEFAULT_BUTTON_COLOR = "#2c3e50";
const DEFAULT_TEXT_COLOR = "#fff";

@Component({
  templateUrl: "./update.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    HlmButtonImports,
    HlmSpinnerImports,
    PasswordFormComponent,
  ],
})
export class PasswordResetUpdateComponent {
  public readonly translate = inject(LanguageService).translator;
  private readonly clientWhitelabeling = inject(WhitelabelingService).value;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly queryParamMap = toSignal(this.route.queryParamMap);

  private readonly token = computed(() => this.queryParamMap()?.get("token"));
  public readonly loginWhitelabeling = computed(() => {
    const brandConf = this.clientWhitelabeling();
    return {
      buttonColor: brandConf?.login?.buttonColor ?? DEFAULT_BUTTON_COLOR,
      textSelector: brandConf?.login?.textColor ?? DEFAULT_TEXT_COLOR,
    };
  });

  // public readonly password = signal<string | null>(null);

  public readonly inputState = signal<
    | { status: "disabled"; error?: undefined }
    | { status: "enabled"; error?: TranslationKey }
  >({ status: "disabled" });

  constructor() {
    effect(() => {
      const token = this.token();
      if (token === undefined) return;
      this.http
        .get(`${environment.apiUrl}/v1/auth/check-user-account`, {
          headers: { authorization: `Bearer ${token}` },
        })
        .subscribe({
          next: (reply: { exists: boolean }) => {
            if (reply.exists) {
              this.inputState.set({ status: "enabled" });
            } else {
              const details: TranslationKey = "passwordReset.updateFailed.unknownUser";
              this.router.navigate(["/login/message"], {
                queryParams: {
                  status: "error",
                  title: "passwordReset.updateFailed.title",
                  details,
                },
              });
            }
          },
          error: (reason) => this.handleError(reason),
        });
    });
  }

  handleError(reason) {
    let details: TranslationKey = "errors.unexpected";
    if (reason.status == 401) {
      details = "passwordReset.updateFailed.expiredToken";
    } else if (reason.status == 403) {
      details = "passwordReset.updateFailed.unknownUser";
    } else {
      console.error(reason);
    }
    this.router.navigate(["/login/message"], {
      queryParams: {
        status: "error",
        title: "passwordReset.updateFailed.title",
        details,
      },
    });
  }

  // send(): void {
  send(ngForm: NgForm): void {

    const password = ngForm.value.passwordForm.newPassword.password;
    // const password = this.password();
    
    this.inputState.set({ status: "disabled" });
    this.http
      .post(
        `${environment.apiUrl}/v1/auth/reset-password`,
        { password },
        { headers: { Authorization: `Bearer ${this.token()}` } },
      )
      .subscribe({
        next: () => {
          this.router.navigate(["/login/message"], {
            queryParams: {
              status: "success",
              title: "passwordReset.updateSuccessful.title",
            },
          });
        },
        error: (reason) => this.handleError(reason),
      });
  }
}
