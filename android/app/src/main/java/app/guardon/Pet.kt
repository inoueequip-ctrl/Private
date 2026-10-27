package app.guardon

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import org.json.JSONObject

/** Web版(digipet/index.html)と同じ進化・ドット絵の定義 */
object Pet {
    private const val PREFS = "guardon"
    private const val KEY_STATE = "state"
    private const val FOOD_STEP_MS = 20L * 60 * 1000   // 20分ごとに ごはん -1

    val STAGE_MIN_XP = intArrayOf(0, 30, 120, 300)
    val STAGE_NAMES = arrayOf(
        "データのタマゴ", "ガードン(幼年期)", "ガードン(成長期)",
        "ガードン(完全体)", "オメガガード(ジョグレス体)"
    )

    private val SPRITES = arrayOf(
        arrayOf("....oooo....", "...obbbbo...", "..obbwbbbo..", "..obwbbbbo..", "..obbbbbbo..", "..obbbwbbo..", "..obbbbbbo..", "...obbbbo...", "....oooo...."),
        arrayOf("............", "...oooooo...", "..obbbbbbo..", ".obbbbbbbbo.", ".obbebbebbo.", ".obbbbbbbbo.", ".obbbmmbbbo.", "..obbbbbbo..", "...oo..oo..."),
        arrayOf(".h........h.", ".hh......hh.", ".ohbbbbbbho.", "obbbbbbbbbbo", "obbebbbbebbo", "obbbbbbbbbbo", "obbbbmmbbbbo", ".obbbbbbbbo.", ".obb.oo.bbo.", "..oo....oo.."),
        arrayOf("..h......h..", ".hhh....hhh.", ".ohhbbbbhho.", "obbbbbbbbbbo", "obbebbbbebbo", "obbbbbbbbbbo", "abbbbmmbbbba", "aabbbbbbbbaa", "aaobbbbbboaa", ".aobb..bboa.", "..oo....oo.."),
        arrayOf("..h......h..", ".hhh....hhh.", ".ohhbbbbhho.", "obbbbbbbbbbo", "obbebbbbebbo", "obbbbmmbbbbo", "kaabbbbbbaas", "kaaobbbbboas", "kk.obbbbbo.s", ".k.obb.bbo.s", "..aoo..ooa..")
    )

    private val PALETTES: Array<Map<Char, Int>> = arrayOf(
        mapOf('o' to "#12332e", 'b' to "#e8fff9", 'w' to "#ffffff"),
        mapOf('o' to "#12332e", 'b' to "#4ee1c1", 'e' to "#04201a", 'm' to "#04201a"),
        mapOf('o' to "#10213f", 'b' to "#5aa9ff", 'h' to "#ffd24e", 'e' to "#04101f", 'm' to "#04101f"),
        mapOf('o' to "#2a1040", 'b' to "#8f6bff", 'h' to "#ffd24e", 'a' to "#4ee1c1", 'e' to "#ffffff", 'm' to "#1a0a2a"),
        mapOf('o' to "#3b2a00", 'b' to "#f2f6ff", 'h' to "#ffd24e", 'a' to "#4ee1c1", 'e' to "#ff4e6a", 'm' to "#3b2a00", 'k' to "#e6ecff", 's' to "#ffd24e")
    ).map { m -> m.mapValues { Color.parseColor(it.value) } }.toTypedArray()

    data class State(val name: String, val stage: Int, val food: Int, val xp: Int)

    fun saveRaw(context: Context, json: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_STATE, json).apply()
    }

    fun load(context: Context, now: Long = System.currentTimeMillis()): State? {
        val raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_STATE, null) ?: return null
        return try {
            val o = JSONObject(raw)
            val xp = o.optInt("xp", 0)
            val stage = if (o.optBoolean("omega", false)) 4 else STAGE_MIN_XP.indexOfLast { xp >= it }
            val lost = ((now - o.optLong("fedAt", now)) / FOOD_STEP_MS).toInt().coerceAtLeast(0)
            State(o.optString("name", "ガードン"), stage, (o.optInt("food", 70) - lost).coerceIn(0, 100), xp)
        } catch (e: Exception) {
            null
        }
    }

    /** ドット絵を [pixel] 倍の正方形ビットマップに描く(拡大時もボケない) */
    fun bitmap(stage: Int, pixel: Int = 16): Bitmap {
        val sprite = SPRITES[stage]
        val palette = PALETTES[stage]
        val bmp = Bitmap.createBitmap(12 * pixel, 12 * pixel, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val paint = Paint().apply { isAntiAlias = false }
        val offsetY = 12 - sprite.size
        sprite.forEachIndexed { y, row ->
            row.forEachIndexed { x, c ->
                val color = palette[c] ?: return@forEachIndexed
                paint.color = color
                canvas.drawRect(
                    (x * pixel).toFloat(), ((y + offsetY) * pixel).toFloat(),
                    ((x + 1) * pixel).toFloat(), ((y + offsetY + 1) * pixel).toFloat(), paint
                )
            }
        }
        return bmp
    }
}
