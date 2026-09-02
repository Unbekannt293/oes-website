<template>
  <div class="page">
    <SiteHeader />
    <main id="inhalt">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.page { min-height: 100dvh; display: flex; flex-direction: column; }
main { flex: 1; }
</style>
