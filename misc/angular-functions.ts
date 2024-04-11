import { Router } from "@angular/router";

export function reloadCurrentRoute(router: Router) {
  const currentUrl = router.url;
  router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    router.navigate([currentUrl]);
  });
}