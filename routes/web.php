<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VideoController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/video', [VideoController::class, 'videoCall'])->name('video');
Route::get('/video-static', [VideoController::class, 'videoCallStatic'])->name('video-static'); 
Route::post('/start-archive', [VideoController::class, 'startArchive'])->name('start-archive');
Route::post('/stop-archive', [VideoController::class, 'stopArchive'])->name('stop-archive');
Route::get('/all-recordings', [VideoController::class, 'listArchives'])->name('all-recordings');
Route::get('/reset-session', [VideoController::class, 'resetSession'])->name('reset-session');

require __DIR__ . '/auth.php';
