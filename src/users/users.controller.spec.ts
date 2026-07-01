import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { findById: jest.Mock };

  beforeEach(async () => {
    usersService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns isBanned from the id endpoint', async () => {
    usersService.findById.mockResolvedValue({
      id: 'user_123',
      username: 'alex',
      isBanned: false,
    });

    await expect(controller.findById('user_123')).resolves.toEqual({
      id: 'user_123',
      username: 'alex',
      isBanned: false,
    });
    expect(usersService.findById).toHaveBeenCalledWith('user_123');
  });
});
