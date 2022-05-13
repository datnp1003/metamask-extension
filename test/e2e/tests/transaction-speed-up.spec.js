const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Speed up transaction', function () {
  it('can speed up a transaction', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver, _, ganacheServer }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        // Stop the CPU mining operation
        await ganacheServer.call('miner_stop');
        // Send transaction
        await driver.clickElement('[data-testid="eth-overview-send"]');
        await driver.fill(
          '[data-testid="ens-input"]',
          '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
        );
        await driver.fill('.unit-input__input', '1');
        await driver.wait(async () => {
          const sendDialogMsgs = await driver.findElements(
            '.send-v2__form div.dialog',
          );
          return sendDialogMsgs.length === 1;
        }, 10000);
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        await driver.waitForSelector({
          css: '.transaction-detail-item:nth-of-type(1) h6:nth-of-type(2)',
          text: '0.000042ETH',
        });
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        // Speed Up transaction
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.findElement('.transaction-list-item');
        await driver.clickElement({ text: 'Speed Up', tag: 'button' });
        const [gasLimitInput, gasPriceInput] = await driver.findElements(
          'input[type="number"]',
        );
        await gasLimitInput.fill('21000');
        await gasPriceInput.fill('9');
        await driver.waitForSelector({
          css: '.transaction-total-banner',
          text: '0.000189 ETH',
        });
        await driver.clickElement({ text: 'Save', tag: 'button' });
        // Force a single block to be mined.
        await driver.delay(2000);
        await ganacheServer.call('evm_mine');
        // Verify transaction in activity log
        const sendTransactionListItem = await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        await sendTransactionListItem.click();
        await driver.clickElement({ text: 'Activity log', tag: 'summary' });
        const [
          createdActivity,
          submittedActivity,
          resubmittedActivity,
          confirmedActivity,
        ] = await driver.findElements('.transaction-activity-log__activity');
        assert.match(
          await createdActivity.getText(),
          /Transaction created with a value of 1 ETH at/u,
        );
        assert.match(
          await submittedActivity.getText(),
          /Transaction submitted with estimated gas fee of 42000 GWEI at/u,
        );
        assert.match(
          await resubmittedActivity.getText(),
          /Transaction resubmitted with estimated gas fee increased to 189000 GWEI at/u,
        );
        assert.match(
          await confirmedActivity.getText(),
          /Transaction confirmed at/u,
        );
      },
    );
  });

  it('can speed up a transaction - EIP1559', async function () {
    const ganacheOptions = {
      hardfork: 'london',
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver, _, ganacheServer }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);
        // Stop the CPU mining operation
        await ganacheServer.call('miner_stop');
        // Send transaction
        await driver.clickElement('[data-testid="eth-overview-send"]');
        await driver.fill(
          '[data-testid="ens-input"]',
          '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
        );
        await driver.fill('.unit-input__input', '1');
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        await driver.waitForSelector({
          css: '.transaction-detail-item:nth-of-type(1) h6:nth-of-type(2)',
          text: '0.00044ETH',
        });
        await driver.clickElement('[data-testid="page-container-footer-next"]');
        // Speed Up transaction
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.findElement('.transaction-list-item');
        await driver.clickElement({ text: 'Speed Up', tag: 'button' });
        const [
          gasLimitInput,
          maxPriorityFeeInput,
          maxFeeInput,
        ] = await driver.findElements('input[type="number"]');
        await gasLimitInput.fill('21000');
        await maxPriorityFeeInput.fill('2');
        await maxFeeInput.fill('29');
        await driver.waitForSelector({
          css: '.transaction-total-banner',
          text: '0.00045033 ETH',
        });
        await driver.clickElement({ text: 'Save', tag: 'button' });
        // Force a single block to be mined.
        await driver.delay(2000);
        await ganacheServer.call('evm_mine');
        // Verify transaction in activity log
        const sendTransactionListItem = await driver.waitForSelector(
          '.transaction-list__completed-transactions .transaction-list-item',
        );
        await sendTransactionListItem.click();
        await driver.clickElement({ text: 'Activity log', tag: 'summary' });
        const [
          createdActivity,
          submittedActivity,
          resubmittedActivity,
          confirmedActivity,
        ] = await driver.findElements('.transaction-activity-log__activity');
        assert.match(
          await createdActivity.getText(),
          /Transaction created with a value of 1 ETH at/u,
        );
        assert.match(
          await submittedActivity.getText(),
          /Transaction submitted with estimated gas fee of 439833.159 GWEI at/u,
        );
        assert.match(
          await resubmittedActivity.getText(),
          /Transaction resubmitted with estimated gas fee increased to 450333.159 GWEI at/u,
        );
        assert.match(
          await confirmedActivity.getText(),
          /Transaction confirmed at/u,
        );
      },
    );
  });
});
