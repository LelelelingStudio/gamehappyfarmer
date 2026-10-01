#!/bin/bash

DOMAINS=(
  "happyfarmer.surge.sh"
  "happy-farmer.surge.sh"
  "happy_farmer.surge.sh"
  "happyfarmergame.surge.sh"
  "happy-farmergame.surge.sh"
  "happy_farmergame.surge.sh"
  "happyfarmer-game.surge.sh"
  "happyfarmer_game.surge.sh"
  "happy-farmer-game.surge.sh"
  "happy-farmer_game.surge.sh"
  "happy_farmer-game.surge.sh"
  "happy_farmer_game.surge.sh"
  "farmer_game.surge.sh"
  "farmergame.surge.sh"
  "farmersgame.surge.sh"
  "farmers-game.surge.sh"
  "farmers_game.surge.sh"
  "farmer-sgame.surge.sh"
  "farmer-s-game.surge.sh"
  "farmer-s_game.surge.sh"
  "farmer_sgame.surge.sh"
  "farmer_s-game.surge.sh"
  "farmer_s_game.surge.sh"
)

TMPDIR=$(mktemp -d /tmp/surge-deploy.XXXXXX)
echo "临时目录：$TMPDIR"
echo "开始并行部署 ${#DOMAINS[@]} 个域名..."
echo ""

for domain in "${DOMAINS[@]}"; do
  (
    LOG_FILE="$TMPDIR/${domain}.log"
    RESULT_FILE="$TMPDIR/${domain}.result"
    if surge . "$domain" > "$LOG_FILE" 2>&1; then
      echo "SUCCESS" > "$RESULT_FILE"
    else
      echo "FAILED" > "$RESULT_FILE"
    fi
  ) &
done

wait

echo ""
echo "============================================================"
echo "部署结果汇总"
echo "============================================================"

SUCCESS_LIST=()
FAILED_LIST=()

for domain in "${DOMAINS[@]}"; do
  RESULT_FILE="$TMPDIR/${domain}.result"
  if [ -f "$RESULT_FILE" ]; then
    STATUS=$(cat "$RESULT_FILE")
    if [ "$STATUS" = "SUCCESS" ]; then
      SUCCESS_LIST+=("$domain")
      echo "成功：$domain"
    else
      FAILED_LIST+=("$domain")
      echo "失败：$domain"
    fi
  else
    FAILED_LIST+=("$domain")
    echo "失败：$domain（无结果文件）"
  fi
done

echo ""
echo "============================================================"
echo "总计：${#DOMAINS[@]} 个域名"
echo "成功：${#SUCCESS_LIST[@]} 个"
echo "失败：${#FAILED_LIST[@]} 个"
echo "============================================================"

if [ ${#FAILED_LIST[@]} -gt 0 ]; then
  echo ""
  echo "以下域名部署失败，日志在 $TMPDIR 目录下："
  for domain in "${FAILED_LIST[@]}"; do
    echo "   - $domain  →  查看日志：cat $TMPDIR/${domain}.log"
  done
fi

echo ""
echo "所有日志保存在：$TMPDIR"
echo "如需清理，可执行：rm -rf $TMPDIR"
