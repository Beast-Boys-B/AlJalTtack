package com.aljalttack.app;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.content.Intent;
import android.widget.ImageView;

public class SplashActivity extends Activity {
    private static final int FRAME_COUNT = 40;
    private static final int FRAME_DELAY_MS = 42; // ~24fps
    private static final String FRAME_NAME_FORMAT = "frame_%02d";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        ImageView frameView = findViewById(R.id.splash_frame_view);
        Handler handler = new Handler(Looper.getMainLooper());

        // Decode and show one frame at a time instead of AnimationDrawable,
        // which preloads all 52 full-screen bitmaps into memory at once.
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
                String name = String.format(FRAME_NAME_FORMAT, i);
                int resId = getResources().getIdentifier(name, "drawable", getPackageName());
                frameView.setImageResource(resId);
                i++;
                handler.postDelayed(step[0], FRAME_DELAY_MS);
            }
        };
        handler.post(step[0]);
    }
}
