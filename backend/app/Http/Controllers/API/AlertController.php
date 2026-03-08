<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    
    public function index(Request $request)
    {
        $user = auth()->user();
        $limit = $request->get('limit', 20);
        $unreadOnly = $request->get('unread_only', false);

        $query = Alert::where('user_id', $user->id)
            ->orderBy('created_at', 'desc');

        if ($unreadOnly) {
            $query->where('is_read', false);
        }

        $alerts = $query->limit($limit)->get();

        return response()->json([
            'success' => true,
            'alerts' => $alerts,
            'unread_count' => Alert::where('user_id', $user->id)->where('is_read', false)->count()
        ]);
    }

    
    public function markAsRead(string $alertId)
    {
        $user = auth()->user();

        $alert = Alert::where('_id', $alertId)
            ->where('user_id', $user->id)
            ->first();

        if (!$alert) {
            return response()->json(['error' => 'Alert not found'], 404);
        }

        $alert->is_read = true;
        $alert->save();

        return response()->json([
            'success' => true,
            'message' => 'Alert marked as read'
        ]);
    }

    
    public function markAllAsRead()
    {
        $user = auth()->user();

        Alert::where('user_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'All alerts marked as read'
        ]);
    }

    
    public function unreadCount()
    {
        $user = auth()->user();

        $count = Alert::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'count' => $count
        ]);
    }
}
