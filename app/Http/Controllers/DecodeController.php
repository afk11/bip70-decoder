<?php

namespace App\Http\Controllers;

use Illuminate\Routing\Controller as BaseController;

class DecodeController extends BaseController
{
    public function index()
    {
        return view('welcome');
    }
}
