import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRecipeReviews, getMyReview, submitReview } from '../api';
import './Reviews.css';

const Stars = ({ value, size = 'sm' }) => (
  <span className={`rv__stars rv__stars--${size}`} aria-label={`${Math.round(value * 10) / 10} out of 5`}>
    {[1, 2, 3, 4, 5].map(i => (
      <i
        key={i}
        className={`fas fa-star${i <= Math.round(value) ? '' : ' rv__star--empty'}`}
        aria-hidden="true"
      />
    ))}
  </span>
);

export default function Reviews({ recipeId, recipeTitle, user, onRequireAuth }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState('');
  const [err, setErr] = useState('');

  const { data: agg } = useQuery({
    queryKey: ['reviews', recipeId],
    queryFn: () => getRecipeReviews(recipeId),
  });

  const { data: mine } = useQuery({
    queryKey: ['my-review', recipeId, user?.id],
    queryFn: () => getMyReview(recipeId),
    enabled: !!user,
  });

  // Prefill the form from the user's existing review once it loads.
  useEffect(() => {
    if (mine) { setRating(mine.rating); setComment(mine.comment || ''); }
  }, [mine]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) { onRequireAuth?.(); return; }
    if (!rating) { setErr('Pick a star rating first.'); return; }
    setSubmitting(true);
    setErr('');
    try {
      await submitReview({ recipeId, recipeTitle, rating, comment });
      setFlash('Thanks! Your review is in and will appear once approved.');
      queryClient.invalidateQueries({ queryKey: ['reviews', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', recipeId, user?.id] });
    } catch (error) {
      setErr(error.message || 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  const reviews = agg?.reviews || [];
  const count = agg?.count || 0;
  const avg = agg?.avg || 0;

  return (
    <section className="rv" aria-label="Ratings and reviews">
      <div className="rv__head">
        <h2><i className="fas fa-star" aria-hidden="true" /> Ratings &amp; Reviews</h2>
        {count > 0 && (
          <div className="rv__score">
            <span className="rv__score-num">{avg.toFixed(1)}</span>
            <Stars value={avg} />
            <span className="rv__score-count">{count} review{count === 1 ? '' : 's'}</span>
          </div>
        )}
      </div>

      {user ? (
        <form className="rv__form" onSubmit={onSubmit}>
          <div className="rv__pick" role="radiogroup" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                type="button"
                key={i}
                className="rv__pick-btn"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(i)}
                aria-label={`Rate ${i} star${i === 1 ? '' : 's'}`}
                aria-pressed={rating === i}
              >
                <i className={`fas fa-star${i <= (hover || rating) ? '' : ' rv__star--empty'}`} aria-hidden="true" />
              </button>
            ))}
          </div>
          <textarea
            className="rv__text"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="How did it turn out? Tips, swaps, timing…"
          />
          <div className="rv__form-foot">
            {mine && (
              <span className={`rv__status rv__status--${mine.status}`}>
                Your review: {mine.status}
              </span>
            )}
            <button className="rv__submit" type="submit" disabled={submitting}>
              {submitting
                ? <><i className="fas fa-spinner fa-spin" aria-hidden="true" /> Sending…</>
                : <>{mine ? 'Update review' : 'Submit review'}</>}
            </button>
          </div>
          {err && <p className="rv__err" role="alert">{err}</p>}
          {flash && <p className="rv__flash" role="status">{flash}</p>}
        </form>
      ) : (
        <button className="rv__signin" onClick={onRequireAuth}>
          <i className="far fa-star" aria-hidden="true" /> Sign in to leave a review
        </button>
      )}

      {count > 0 ? (
        <ul className="rv__list">
          {reviews.map(rv => (
            <li key={rv._id} className="rv__item">
              <div className="rv__item-head">
                <span className="rv__avatar">{(rv.userId?.name || '?').charAt(0).toUpperCase()}</span>
                <div>
                  <p className="rv__author">{rv.userId?.name || 'Cook'}</p>
                  <Stars value={rv.rating} />
                </div>
                <time className="rv__date" dateTime={rv.createdAt}>
                  {new Date(rv.createdAt).toLocaleDateString()}
                </time>
              </div>
              {rv.comment && <p className="rv__body">{rv.comment}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rv__empty">No reviews yet — be the first to rate this dish.</p>
      )}
    </section>
  );
}
