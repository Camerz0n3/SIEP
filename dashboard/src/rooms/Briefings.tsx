import { RoomHeader } from '../components/RoomHeader'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { formatTime, formatFullDate } from '../utils/time'
import type { Briefing } from '../types'
import styles from './Briefings.module.css'

export function Briefings() {
  const { data: briefings, loading, error } = useAutoRefresh<Briefing[]>('/api/briefings')

  const daily = briefings?.find(b => b.type === 'daily')
  const weekly = briefings?.find(b => b.type === 'weekly')
  const isLoading = briefings === null && loading

  return (
    <>
      <RoomHeader
        icon={'\u{1F4F0}'}
        title="The Reading Room"
        subtitle="Your daily and weekly intelligence dossier"
      />
      <div className={styles.content}>
        {/* Daily briefing — The Morning Paper */}
        {daily ? (
          <div className={styles.newspaper}>
            {/* Masthead */}
            <div className={styles.masthead}>
              <div className={styles.mastheadRule} />
              <div className={styles.mastheadTitle}>THE SIEP DAILY</div>
              <div className={styles.mastheadSub}>
                <span>VERBIER, SWITZERLAND</span>
                <span className={styles.mastheadDot}>{'\u2022'}</span>
                <span>{formatFullDate(daily.sent_at).toUpperCase()}</span>
                <span className={styles.mastheadDot}>{'\u2022'}</span>
                <span>EST. 2026</span>
              </div>
              <div className={styles.mastheadRule} />
            </div>

            {/* Headline */}
            <div className={styles.headline}>Morning Briefing</div>
            <div className={styles.byline}>
              Filed by S.I.E.P at {formatTime(daily.sent_at)} &mdash; For the boss's eyes only
            </div>

            {/* Body */}
            <div className={styles.paperBody}>
              {daily.content.split('\n').map((line, i) => (
                <p key={`d-${i}`} className={styles.paperLine}>
                  {line || '\u00A0'}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyNewspaper}>
              <div className={styles.emptyMasthead}>THE SIEP DAILY</div>
              <div className={styles.emptyHeadline}>
                {error ? 'PRESSES JAMMED' : isLoading ? 'PRINTING...' : 'NO EDITION TODAY'}
              </div>
              <div className={styles.emptyBody}>
                {error
                  ? `Couldn't reach the print room, boss \u2014 ${error}.`
                  : isLoading
                  ? 'Fetching the morning edition from the presses...'
                  : "The morning paper hasn't been printed yet, boss. Siep generates one fresh at 07:00 each morning."}
              </div>
            </div>
          </div>
        )}

        {/* Weekly wrap — The Sunday Paper */}
        {weekly ? (
          <div className={`${styles.newspaper} ${styles.weekly}`}>
            <div className={styles.masthead}>
              <div className={styles.mastheadRule} />
              <div className={styles.mastheadTitle}>THE SUNDAY WRAP</div>
              <div className={styles.mastheadSub}>
                <span>WEEKLY INTELLIGENCE REPORT</span>
                <span className={styles.mastheadDot}>{'\u2022'}</span>
                <span>{formatFullDate(weekly.sent_at).toUpperCase()}</span>
              </div>
              <div className={styles.mastheadRule} />
            </div>

            <div className={styles.headline}>Week in Review</div>
            <div className={styles.byline}>
              Compiled by S.I.E.P &mdash; {formatTime(weekly.sent_at)}
            </div>

            <div className={styles.paperBody}>
              {weekly.content.split('\n').map((line, i) => (
                <p key={`w-${i}`} className={styles.paperLine}>
                  {line || '\u00A0'}
                </p>
              ))}
            </div>
          </div>
        ) : daily && !isLoading && !error && (
          <div className={styles.emptyState}>
            <div className={styles.emptyNewspaper}>
              <div className={styles.emptyMasthead}>THE SUNDAY WRAP</div>
              <div className={styles.emptyHeadline}>NEXT EDITION SUNDAY</div>
              <div className={styles.emptyBody}>
                Week's not wrapped yet, boss. The Sunday edition lands Sunday evening.
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
