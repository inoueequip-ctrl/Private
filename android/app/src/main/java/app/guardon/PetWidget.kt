package app.guardon

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class PetWidget : AppWidgetProvider() {

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_FEED) {
            Pet.feed(context)
            refresh(context)
        }
    }

    override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
        appWidgetIds.forEach { manager.updateAppWidget(it, buildViews(context)) }
    }

    companion object {
        private const val ACTION_FEED = "app.guardon.FEED"

        /** アプリ側で状態が変わったときにウィジェットを更新する */
        fun refresh(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val ids = manager.getAppWidgetIds(ComponentName(context, PetWidget::class.java))
            ids.forEach { manager.updateAppWidget(it, buildViews(context)) }
        }

        private fun buildViews(context: Context): RemoteViews {
            val views = RemoteViews(context.packageName, R.layout.widget_pet)
            val state = Pet.load(context)
            if (state == null) {
                views.setImageViewBitmap(R.id.pet_image, Pet.bitmap(0))
                views.setTextViewText(R.id.pet_name, "ガードン")
                views.setTextViewText(R.id.pet_stage, "タップしてはじめよう")
                views.setTextViewText(R.id.pet_food_label, "")
                views.setProgressBar(R.id.pet_food, 100, 0, false)
            } else {
                views.setImageViewBitmap(R.id.pet_image, Pet.bitmap(state.stage))
                views.setTextViewText(R.id.pet_name, if (state.stage == 0) "タマゴ" else state.name)
                views.setTextViewText(R.id.pet_stage, Pet.STAGE_NAMES[state.stage])
                views.setTextViewText(R.id.pet_food_label, "ごはん ${state.food}/100" + if (state.food == 0) "  🍙ほしい…" else "")
                views.setProgressBar(R.id.pet_food, 100, state.food, false)
            }
            val open = PendingIntent.getActivity(
                context, 0, Intent(context, MainActivity::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_root, open)
            val feed = PendingIntent.getBroadcast(
                context, 1, Intent(context, PetWidget::class.java).setAction(ACTION_FEED),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.feed_button, feed)
            return views
        }
    }
}
