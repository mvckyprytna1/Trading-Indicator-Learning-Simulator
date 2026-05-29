// Manajer Navigasi Aplikasi
class AppRouter {
    constructor() {
        this.pageViews = document.querySelectorAll('.page-view');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.headerTitle = document.getElementById('current-title');
        
        this.init();
    }

    init() {
        // Gunakan Event Delegation pada level document agar aman dan responsif
        document.addEventListener('click', (e) => {
            const targetButton = e.target.closest('[data-page]');
            if (targetButton) {
                e.preventDefault();
                const pageId = targetButton.getAttribute('data-page');
                this.navigateTo(pageId);
            }
        });

        // Sinkronisasi rute jika ada perubahan hash URL (opsional/fitur pelengkap)
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash) this.navigateTo(hash);
        });
    }

    navigateTo(pageId) {
        const targetSection = document.getElementById(`page-${pageId}`);
        if (!targetSection) return;

        // 1. Sembunyikan semua halaman dengan transisi yang lembut
        this.pageViews.forEach(view => {
            view.classList.add('hidden');
        });

        // 2. Tampilkan halaman target
        targetSection.classList.remove('hidden');

        // 3. Update status active pada tombol navigasi (Desktop & Mobile)
        this.navLinks.forEach(link => {
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active-link');
            } else {
                link.classList.remove('active-link');
            }
        });

        // 4. Perbarui Judul Header Utama secara otomatis
        if (this.headerTitle) {
            const formatTitle = pageId.charAt(0).toUpperCase() + pageId.slice(1);
            this.headerTitle.textContent = formatTitle === 'Materi' ? 'Materi Indikator' : formatTitle;
        }

        // 5. Update Hash URL secara halus tanpa reload halaman
        window.history.pushState(null, null, `#${pageId}`);
    }
}

// Inisialisasi sistem saat DOM selesai dimuat sepenuhnya
document.addEventListener('DOMContentLoaded', () => {
    new AppRouter();
});
