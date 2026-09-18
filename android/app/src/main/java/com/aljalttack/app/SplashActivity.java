package com.aljalttack.app;

import android.app.Activity;
import android.content.res.TypedArray;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.content.Intent;
import android.widget.ImageView;

public class SplashActivity extends Activity {
    private static final int FRAME_COUNT = 61;
    private static final int FRAME_DELAY_MS = 23; // 61 frames * 23ms ≈ 1.38s total

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        ImageView frameView = findViewById(R.id.splash_frame_view);
        Handler handler = new Handler(Looper.getMainLooper());

        // Resource ids resolved at compile time via an array resource;
        // getIdentifier() does a string lookup per call and is too slow to
        // use once per frame (or even once per frame up front).
        TypedArray frames = getResources().obtainTypedArray(R.array.splash_frames);
        int[] frameResIds = new int[FRAME_COUNT];
        for (int i = 0; i < FRAME_COUNT; i++) {
            frameResIds[i] = frames.getResourceId(i, 0);
        }
        frames.recycle();

        // Decode and show one frame at a time instead of AnimationDrawable,
        // which preloads all full-screen bitmaps into memory at once.
        Runnable[] step = new Runnable[1];
        step[0] = new Runnable() {
            int i = 0;

            @Override
            public void run() {
                if (i >= FRAME_COUNT) {
                    startActivity(new Intent(SplashActivity.this, MainActivity.class));
                    finish();
                    return;
                }
                frameView.setImageResource(frameResIds[i]);
                i++;
                handler.postDelayed(step[0], FRAME_DELAY_MS);
            }
        };
        handler.post(step[0]);
    }
}
