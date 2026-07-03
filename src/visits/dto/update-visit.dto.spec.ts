import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateVisitDto } from './update-visit.dto';

describe('UpdateVisitDto', () => {
  it('allows zero rating when editing a visit', async () => {
    const dto = plainToInstance(UpdateVisitDto, {
      ratings: [
        {
          nickname: 'alex',
          rating: 0,
        },
      ],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
