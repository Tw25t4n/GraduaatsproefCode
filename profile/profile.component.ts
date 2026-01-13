import { HttpClient } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from "@angular/core";
import { UserService } from "../../services/user.service";
import { environment } from "../../../environments/environment";
import { AuthenticationService } from "../../core/services/authentication.service";
import { LanguageService } from "../../services/language.service";
import { switchMap } from "rxjs";
import { CommonModule } from "@angular/common";
import { GodComponent } from "../../shared/components/ui/god/god.component";
import { TranslationKey } from "../../translations";
import { PasswordFormComponent } from "../auth/password-reset/update/password-form/password-form.component";
import { FormsModule, NgForm } from "@angular/forms";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, GodComponent, PasswordFormComponent],
})
export class ProfileComponent {
  private readonly authenticationService = inject(AuthenticationService);
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  public readonly translate = inject(LanguageService).translator;

  public readonly email = computed(() => this.userService.user().user.email);

  // public readonly oldPassword = signal<string>("");
  // public readonly hideOldPassword = signal<boolean>(true);
  // public readonly newPassword = signal<string>("");

  public readonly passwordState = signal<
    | {
        status: "enabled";
        message?: { key: TranslationKey; type: "error" | "success" };
      }
    | { status: "disabled"; message?: undefined }
  >({ status: "enabled" });

  // public readonly password = signal<string>("");
  // public readonly hidePassword = signal<boolean>(true);
  // public readonly newUsername = signal<string>("");
  // public readonly newUsernameDuplicate = signal<string>("");
  // public readonly usernameState = signal<
  //   | {
  //       status: "enabled";
  //       message?: { key: TranslationKey; type: "error" | "success" };
  //     }
  //   | { status: "disabled"; message?: undefined }
  // >({ status: "enabled" });

  // updatePassword() {
  updatePassword(ngForm: NgForm) {

    // const oldPassword = this.oldPassword();
    // const newPassword = this.newPassword();

    const value = ngForm.value.passwordForm;
    let error: TranslationKey | undefined = undefined;

    // if (!oldPassword) {
    if (!value.oldPassword) {

      error = "profile.password.errors.noCurrentPassword";
      
    //  } else if (!newPassword) {
    // error = "profile.password.errors.invalidNewPassword";

    // Added
    } else if (!ngForm.valid) {
      const newPasswordErrors = ngForm.form.get("passwordForm.newPassword")?.errors;
      if (
        newPasswordErrors?.["passwordsMustMatch"] &&
        Object.keys(newPasswordErrors).length === 1
      ) {
        error = "passwordReset.form.requirements.passwordsMustMatch";
      } else {
        error = "profile.password.errors.invalidNewPassword";
      }
    }

    if (error) {
      // Added
      ngForm.form.markAsPristine();
      return this.passwordState.set({
        status: "enabled",
        message: {
          type: "error",
          key: error,
        },
      });
    }
    this.passwordState.set({ status: "disabled" });
    this.authenticationService.accessToken$
      .pipe(
        switchMap((token) =>
          this.http.post(
            `${environment.apiUrl}/v1/auth/update-password`,
            {
              
              // oldPassword,
              // newPassword,
              oldPassword: value.oldPassword,
              newPassword: value.newPassword.password,

            },
            {
              headers: { authorization: `Bearer ${token}` },
            },
          ),
        ),
      )
      .subscribe({
        next: () => {
          this.passwordState.set({
            status: "enabled",
            message: {
              key: "profile.password.updateSuccessful",
              type: "success",
            },
          });

          // this.newPassword.set("");
          // this.oldPassword.set("");

        },
        error: (reason) => {
          let error: TranslationKey = "errors.unexpected";
          if (reason.status === 401 && reason.error === "Incorrect old password") {
            error = "profile.password.errors.invalidCurrentPassword";
          } else {
            console.error(reason);
          }
          this.passwordState.set({
            status: "enabled",
            message: {
              type: "error",
              key: error,
            },
          });
        },

          // Added
          complete: () => {
          ngForm.form.markAsPristine();
          
        },
      });
  }
}
