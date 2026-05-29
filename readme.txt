Cara Mengubah Materi Pembelajaran
Jika Anda ingin menambahkan indikator teknikal baru (misalnya Bollinger Bands atau Fibonacci Retracement):

Buka file script.js.

Cari variabel array bernama MaterialsData.

Tambahkan objek JSON baru di dalam array tersebut dengan format:

JavaScript:

{ 
  id: "id_indikator", 
  title: "Nama Indikator", 
  icon: "fa-icon-awesome", 
  desc: "Penjelasan fungsi dasar", 
  safe: "Sinyal kondisi aman", 
  alert: "Sinyal kondisi waspada", 
  risk: "Sinyal kondisi bahaya" 
}

Simpan file script.js dan muat ulang browser Anda (F5). Menu materi, cheat sheet, dan progress dashboard akan langsung terperbarui secara otomatis.